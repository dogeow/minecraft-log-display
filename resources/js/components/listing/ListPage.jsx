export default function ListPage({ title, children }) {
  return (
    <main className="archive-shell archive-list-shell">
      <h1 className="sr-only">{title}</h1>
      {children}
    </main>
  );
}
