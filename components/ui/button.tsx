export function Button({ children, ...props }: any) {
  return <button className="bg-blue-600 text-white px-4 py-2 rounded" {...props}>{children}</button>;
}