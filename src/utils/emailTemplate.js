const getStatusColor = (status) => {
  const key = String(status || "").toLowerCase();
  const map = {
    pending: "#2563eb",
    submitted: "#2563eb",
    approved: "#16a34a",
    printing: "#f59e0b",
    ready: "#7c3aed",
    completed: "#166534",
    rejected: "#dc2626"
  };
  return map[key] || "#2563eb";
};

const toDateText = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const generateEmailTemplate = ({
  title,
  studentName,
  message,
  applicationId,
  status,
  collectFrom,
  collectTo
}) => {
  const statusColor = getStatusColor(status);
  const showWindow = String(status || "").toLowerCase() === "ready" && collectFrom && collectTo;
  const windowText = showWindow
    ? `${toDateText(collectFrom)} - ${toDateText(collectTo)}`
    : "Pending";

  return `
<div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(17,24,39,0.15);">
    <div style="background:linear-gradient(135deg,#6d28d9,#7c3aed,#8b5cf6);padding:22px 24px;color:#ffffff;">
      <h1 style="margin:0;font-size:22px;line-height:1.3;">Smart ID System</h1>
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 12px 0;color:#111827;font-size:20px;">${title}</h2>
      <p style="margin:0 0 14px 0;color:#374151;font-size:15px;">Hello ${studentName || "Student"},</p>
      <p style="margin:0 0 14px 0;color:#374151;font-size:15px;">${message}</p>
      <p style="margin:0 0 10px 0;color:#111827;font-size:14px;"><strong>Application ID:</strong> ${applicationId || "-"}</p>
      <p style="margin:0 0 14px 0;color:#111827;font-size:14px;">
        <strong>Status:</strong>
        <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${statusColor};color:#ffffff;font-size:12px;font-weight:700;vertical-align:middle;">
          ${status || "Pending"}
        </span>
      </p>
      ${String(status || "").toLowerCase() === "ready" ? `<p style="margin:0;color:#111827;font-size:14px;"><strong>Collect Between:</strong> ${windowText}</p>` : ""}
    </div>
    <div style="background:#f9fafb;padding:14px 24px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
      This is an automated message from Smart ID System.
    </div>
  </div>
</div>
`;
};

module.exports = {
  generateEmailTemplate
};
