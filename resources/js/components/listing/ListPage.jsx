export default function ListPage({ title, children }) {
  return (
    <main className="container mx-auto p-2">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
      </header>
      {children}
    </main>
  );
}
