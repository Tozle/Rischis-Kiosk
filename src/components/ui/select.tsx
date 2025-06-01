export function Select({ value, onChange, children }: any) {
  return <select value={value} onChange={e => onChange(e.target.value)}>{children}</select>;
}
export function SelectItem({ value, children }: any) {
  return <option value={value}>{children}</option>;
}