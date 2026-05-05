# ============================================================
# FILE: backend/hrms_backend/hrms/views_chatbot.py
# REPLACE your existing views_chatbot.py with this
# ============================================================

import json
import os
from datetime import date, timedelta

import requests
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Employee, Leave, Holiday, Announcement, LeaveType


# ─── CONFIG ───────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY    = os.environ.get("OPENAI_API_KEY", "")


# ─── DB CONTEXT ───────────────────────────────────────────────
def get_employee_context(user):
    context = {
        "employee_name": user.get_full_name() or user.username,
        "email": user.email,
        "department": "N/A",
        "designation": "N/A",
        "employee_id": "N/A",
        "account_type": getattr(user, "account_type", "employee"),
        "leave_balances": {},
        "pending_leaves": [],
        "approved_leaves": [],
        "upcoming_holidays": [],
        "recent_announcements": [],
        "company_policies": get_company_policies(),
    }

    try:
        emp = Employee.objects.select_related("department").get(user=user)
        context["department"]  = str(emp.department) if emp.department else "N/A"
        context["designation"] = emp.designation or "N/A"
        context["employee_id"] = emp.employee_id or "N/A"

        # Leave balances
        try:
            leave_types = LeaveType.objects.all()
            for lt in leave_types:
                used = Leave.objects.filter(
                    employee=emp,
                    leave_type=lt,
                    status="approved",
                    start_date__year=date.today().year,
                ).count()
                total_attr = f"{lt.name.lower().replace(' ', '_')}_balance"
                total = getattr(emp, total_attr, 12)
                context["leave_balances"][lt.name] = {
                    "total": total,
                    "used": used,
                    "remaining": max(0, total - used),
                }
        except Exception:
            # Fallback: use casual/sick balance fields directly on Employee
            context["leave_balances"]["Casual Leave"] = {
                "total": getattr(emp, "casual_leave_balance", 12),
                "used": Leave.objects.filter(employee=emp, status="approved",
                    start_date__year=date.today().year).count(),
                "remaining": getattr(emp, "casual_leave_balance", 12),
            }

        # Pending leaves
        pending = Leave.objects.filter(employee=emp, status="pending").order_by("-created_at")[:5]
        context["pending_leaves"] = [
            {"type": str(getattr(l, "leave_type", "Leave")),
             "start": str(l.start_date), "end": str(l.end_date),
             "reason": getattr(l, "reason", "") or ""}
            for l in pending
        ]

        # Approved leaves
        approved = Leave.objects.filter(employee=emp, status="approved").order_by("-start_date")[:5]
        context["approved_leaves"] = [
            {"type": str(getattr(l, "leave_type", "Leave")),
             "start": str(l.start_date), "end": str(l.end_date)}
            for l in approved
        ]

    except Employee.DoesNotExist:
        pass

    # Upcoming holidays
    today = date.today()
    holidays = Holiday.objects.filter(
        date__gte=today, date__lte=today + timedelta(days=60)
    ).order_by("date")[:10]
    context["upcoming_holidays"] = [
        {"name": h.name, "date": str(h.date)} for h in holidays
    ]

    # Recent announcements
    announcements = Announcement.objects.order_by("-created_at")[:5]
    context["recent_announcements"] = [
        {"title": a.title, "date": str(a.created_at.date())}
        for a in announcements
    ]

    return context


def get_company_policies():
    return """
Leave Policy:
- Employees receive 12 casual leaves and 12 sick leaves per year.
- Leaves must be applied at least 1 day in advance (except emergencies).
- More than 3 consecutive sick leave days requires a medical certificate.
- Unused casual leave lapses at year end.

Attendance Policy:
- Office hours: 9:00 AM to 6:00 PM, Monday to Saturday.
- Late arrivals beyond 15 minutes are marked half-day after 3 occurrences/month.

Password / Login Help:
- Use the Forgot Password link on the login page to reset your password.
- New employees must change their temporary password on first login.
- For access issues contact HR or IT support.

General:
- Announcements and holidays are posted on the HRMS dashboard.
- For payslips contact the Finance or HR department.
- Probation period is 3 months for new joiners.
    """.strip()


# ─── PROMPT BUILDER ───────────────────────────────────────────
def build_prompt(context, user_query, history):
    leave_text = ""
    for name, bal in context["leave_balances"].items():
        leave_text += f"  - {name}: {bal['remaining']} remaining (used {bal['used']} of {bal['total']})\n"
    if not leave_text:
        leave_text = "  Leave balance data not available.\n"

    holidays_text = "\n".join(
        f"  - {h['name']} on {h['date']}" for h in context["upcoming_holidays"]
    ) or "  No upcoming holidays in the next 60 days."

    pending_text = "\n".join(
        f"  - {l['type']} from {l['start']} to {l['end']}"
        for l in context["pending_leaves"]
    ) or "  None."

    announcements_text = "\n".join(
        f"  - {a['title']} ({a['date']})" for a in context["recent_announcements"]
    ) or "  None."

    history_text = ""
    for msg in history[-6:]:
        role = "Employee" if msg.get("role") == "user" else "Assistant"
        history_text += f"{role}: {msg.get('content', '')}\n"

    return f"""You are an intelligent, friendly HR assistant chatbot integrated into an HRMS system.

STRICT RULES:
- Answer ONLY based on the context data provided below.
- Do NOT hallucinate or invent data.
- If information is missing, say: "I don't have that information. Please contact HR directly."
- Be concise, warm, and professional.
- Personalize responses using the employee's name.

EMPLOYEE CONTEXT (live DB data):
Name         : {context['employee_name']}
Employee ID  : {context['employee_id']}
Department   : {context['department']}
Designation  : {context['designation']}
Account Type : {context['account_type']}

LEAVE BALANCES (current year):
{leave_text}
PENDING LEAVE REQUESTS:
{pending_text}

UPCOMING HOLIDAYS (next 60 days):
{holidays_text}

RECENT ANNOUNCEMENTS:
{announcements_text}

COMPANY POLICIES:
{context['company_policies']}

CONVERSATION HISTORY:
{history_text}

Employee Question: {user_query}

Assistant Response:"""


# ─── AI CALLER ────────────────────────────────────────────────
def call_ai(prompt):
    # Try Anthropic
    if ANTHROPIC_API_KEY:
        try:
            resp = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 512,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=20,
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"].strip()
        except Exception as e:
            print(f"[Chatbot] Anthropic error: {e}")

    # Try OpenAI
    if OPENAI_API_KEY:
        try:
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 512,
                    "temperature": 0.4,
                },
                timeout=20,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Chatbot] OpenAI error: {e}")

    return (
        "I'm sorry, the AI service is temporarily unavailable. "
        "Please contact HR directly for assistance."
    )


# ─── DRF APIView (uses JWT like your other views) ─────────────
class ChatbotView(APIView):
    """
    POST /api/chatbot/
    Uses DRF + JWT authentication (same as your other API views).
    No login_required — no redirect to /accounts/login/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user_query = (request.data.get("query") or "").strip()
            history    = request.data.get("history") or []

            if not user_query:
                return Response(
                    {"error": "Query is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 1. Fetch real HR data
            context = get_employee_context(request.user)

            # 2. Build RAG prompt
            prompt = build_prompt(context, user_query, history)

            # 3. Call AI
            reply = call_ai(prompt)

            return Response({
                "reply": reply,
                "employee_name": context["employee_name"],
            })

        except Exception as e:
            print(f"[Chatbot] Unexpected error: {e}")
            return Response(
                {"error": "Internal server error", "reply": "Something went wrong. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )