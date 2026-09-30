from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.database import get_db
from app.models.models import ParkingSlot, ParkingSession
import io

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/pdf")
def export_pdf(db: Session = Depends(get_db)):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import cm

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle("title", parent=styles["Heading1"], fontSize=24, textColor=colors.HexColor("#0ea5e9"))
        story.append(Paragraph("SMARTPARK AI", title_style))
        story.append(Paragraph("Parking Report", styles["Heading2"]))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))
        story.append(Spacer(1, 0.5 * cm))

        # Stats
        slots = db.query(ParkingSlot).filter(ParkingSlot.is_active == True).all()
        total = len(slots)
        occupied = sum(1 for s in slots if s.status == "occupied")
        available = total - occupied
        occupancy_rate = round((occupied / total * 100) if total > 0 else 0, 1)

        stats_data = [
            ["Metric", "Value"],
            ["Total Slots", str(total)],
            ["Available", str(available)],
            ["Occupied", str(occupied)],
            ["Occupancy Rate", f"{occupancy_rate}%"],
        ]
        table = Table(stats_data, colWidths=[8 * cm, 8 * cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f9ff")]),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.5 * cm))

        # Recent sessions
        story.append(Paragraph("Recent Parking Sessions", styles["Heading3"]))
        sessions = (
            db.query(ParkingSession)
            .order_by(ParkingSession.entry_time.desc())
            .limit(20)
            .all()
        )

        session_data = [["ID", "Slot", "Entry", "Exit", "Duration", "Status"]]
        for s in sessions:
            from sqlalchemy.orm import joinedload
            slot_code = s.slot.slot_code if s.slot else "—"
            entry = s.entry_time.strftime("%H:%M %d/%m") if s.entry_time else "—"
            exit_ = s.exit_time.strftime("%H:%M %d/%m") if s.exit_time else "—"
            duration = f"{s.duration_minutes:.0f}m" if s.duration_minutes else "—"
            session_data.append([str(s.id), slot_code, entry, exit_, duration, s.status])

        if len(session_data) > 1:
            stbl = Table(session_data, colWidths=[1.5 * cm, 2.5 * cm, 3 * cm, 3 * cm, 2 * cm, 3 * cm])
            stbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ]))
            story.append(stbl)

        story.append(Spacer(1, 1 * cm))
        story.append(Paragraph("SmartPark AI — AI-Powered Smart Parking Management System", styles["Italic"]))

        doc.build(story)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=smartpark_report.pdf"},
        )
    except ImportError:
        return {"error": "reportlab not installed. Run: pip install reportlab"}
