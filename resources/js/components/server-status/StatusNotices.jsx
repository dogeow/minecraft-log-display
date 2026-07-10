export default function StatusNotices({ serverStatus, isDark }) {
  return (
    <>
      {serverStatus.errors?.length > 0 && (
        <div className="mx-auto mt-6 max-w-3xl space-y-3">
          {serverStatus.errors.map((error, index) => (
            <div
              key={index}
              className={`rounded-lg border border-yellow-400/30 bg-yellow-300/10 px-4 py-3 text-sm ${isDark ? "text-yellow-100" : "text-yellow-700"}`}
            >
              {error}
            </div>
          ))}
        </div>
      )}

      {serverStatus.query_unavailable && (
        <div
          className={`mx-auto mt-6 max-w-3xl rounded-lg border border-sky-400/30 bg-sky-300/10 px-4 py-3 text-sm ${isDark ? "text-sky-100" : "text-sky-700"}`}
        >
          服务器在线，但 Query
          协议未响应，因此玩家列表和部分详细字段可能不完整。
        </div>
      )}
    </>
  );
}
