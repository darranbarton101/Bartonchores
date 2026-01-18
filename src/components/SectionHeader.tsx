import React from "react";

export default function SectionHeader({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <h2 className="section-title">{title}</h2>
      {subtitle ? <div className="muted">{subtitle}</div> : null}
    </div>
  );
}
