export default function StepIndicator({ current }) {
  const steps = ['Search', 'Compare', 'Pay', 'Booked'];

  return (
    <div className="steps">
      {steps.map((label, i) => {
        const idx = i + 1;
        const isDone = idx < current;
        const isActive = idx === current;

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="step-num">{isDone ? '✓' : idx}</div>
              <span>{label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}
