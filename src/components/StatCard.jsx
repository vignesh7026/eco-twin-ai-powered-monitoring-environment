function StatCard({ title, value }) {
  return (
    <div style={{ background: "#1e293b", padding: "20px", color: "white" }}>
      <p>{title}</p>
      <h2>{String(value)}</h2>
    </div>
  );
}

export default StatCard;