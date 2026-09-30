// Keep list state in the URL so bookmarks and Back/Forward restore the same view.
export function updateListQuery(current, updates) {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === "" || value === null || value === undefined)
      params.delete(key);
    else params.set(key, String(value));
  }
  params.delete("page");
  return params;
}

export function paginationPages(current, last) {
  const pages = new Set([1, last]);
  for (
    let page = Math.max(1, current - 1);
    page <= Math.min(last, current + 1);
    page++
  )
    pages.add(page);
  return [...pages]
    .filter((page) => page > 0)
    .sort((a, b) => a - b)
    .flatMap((page, index, list) =>
      index > 0 && page - list[index - 1] > 1 ? ["gap-" + page, page] : [page],
    );
}
