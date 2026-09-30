import React from "react";
import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { SWRConfig } from "swr";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import { ThemeProvider } from "../../resources/js/contexts/ThemeContext";
import Nav from "../../resources/js/components/Nav";
import Pagination from "../../resources/js/components/Pagination";
import SearchToolbar from "../../resources/js/components/listing/SearchToolbar";
import DailyStatsPage from "../../resources/js/pages/DailyStatsPage";
import LoginPage from "../../resources/js/pages/LoginPage";
import AdminPage from "../../resources/js/pages/AdminPage";
import ApiPage from "../../resources/js/components/ApiPage";
import { fetchJson } from "../../resources/js/lib/api";
import { formatDuration } from "../../resources/js/lib/formatDuration";
import {
  paginationPages,
  updateListQuery,
} from "../../resources/js/lib/listQuery";
import useListQuery from "../../resources/js/hooks/useListQuery";
import { mediaListeners } from "./setup";

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>返回上页</button>
    </>
  );
}
function SearchFixture() {
  const { search, setSearch } = useListQuery();
  return (
    <>
      <SearchToolbar
        dates
        value={search}
        onChange={setSearch}
        placeholder="搜索用户名"
      />
      <LocationProbe />
    </>
  );
}
function renderNav() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Nav isAdmin />
        <LocationProbe />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

it("resets only pagination when changing a filter or sort", () => {
  expect(
    updateListQuery("page=9&search=Alex&sort=date&direction=desc", {
      sort: "online_time",
    }).toString(),
  ).toBe("search=Alex&sort=online_time&direction=desc");
  expect(
    updateListQuery("page=3&search=Alex&per_page=25", {
      search: "",
    }).toString(),
  ).toBe("per_page=25");
});

it("builds bounded, unique pagination for first, middle, final and empty pages", () => {
  expect(paginationPages(1, 1)).toEqual([1]);
  expect(paginationPages(1, 126)).toEqual([1, 2, "gap-126", 126]);
  expect(paginationPages(60, 126)).toEqual([
    1,
    "gap-59",
    59,
    60,
    61,
    "gap-126",
    126,
  ]);
  expect(paginationPages(126, 126)).toEqual([1, "gap-125", 125, 126]);
});

it("formats numeric seconds without wrapping hours or treating missing values as zero", () => {
  expect(
    [81, 1799, 3556, 0, 86401, null, undefined, -1, "bad"].map(formatDuration),
  ).toEqual([
    "00:01:21",
    "00:29:59",
    "00:59:16",
    "00:00:00",
    "24:00:01",
    "—",
    "—",
    "—",
    "—",
  ]);
});

it("disables boundary pagination and preserves filters and sorting", () => {
  render(
    <MemoryRouter>
      <Pagination
        items={{
          meta: { current_page: 1, last_page: 3, total: 21, from: 1, to: 10 },
        }}
        searchParams={
          new URLSearchParams("search=Alex&sort=online_time&direction=desc")
        }
      />
    </MemoryRouter>,
  );
  expect(screen.getByText("上一页").getAttribute("aria-disabled")).toBe("true");
  expect(screen.queryByRole("link", { name: "上一页" })).toBeNull();
  expect(
    screen.getByRole("link", { name: "下一页" }).getAttribute("href"),
  ).toContain("search=Alex&sort=online_time&direction=desc&page=2");
  expect(
    screen.getByRole("link", { name: "第 1 页" }).getAttribute("aria-current"),
  ).toBe("page");
});

it("submits search once, resets page, keeps sort, and restores input with Back", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter
      initialEntries={[
        "/daily-stats?search=Alex&page=9&sort=online_time&direction=asc",
      ]}
    >
      <SearchFixture />
    </MemoryRouter>,
  );
  const search = screen.getByPlaceholderText("搜索用户名");
  await user.clear(search);
  await user.type(search, "Steve");
  expect(screen.getByTestId("location").textContent).toContain("page=9");
  await user.click(screen.getByRole("button", { name: "筛选" }));
  expect(screen.getByTestId("location").textContent).toBe(
    "/daily-stats?search=Steve&sort=online_time&direction=asc",
  );
  await user.click(screen.getByRole("button", { name: "返回上页" }));
  expect(search.value).toBe("Alex");
  expect(screen.getByTestId("location").textContent).toContain("page=9");
});

it("toggles date/duration sorting globally through the URL and retains other filters", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter
      initialEntries={["/daily-stats?page=4&search=Alex&start_date=2026-01-01"]}
    >
      <DailyStatsPage
        dailyStats={{
          data: [
            {
              id: 1,
              date: "2026-01-02",
              online_time: 81,
              user: { username: "Alex" },
            },
          ],
          meta: { current_page: 4, last_page: 4, total: 31, from: 31, to: 31 },
        }}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole("button", { name: "在线时长，改为升序" }));
  expect(screen.getByTestId("location").textContent).toBe(
    "/daily-stats?search=Alex&start_date=2026-01-01&sort=online_time&direction=asc",
  );
  await user.click(screen.getByRole("button", { name: "在线时长，改为降序" }));
  expect(screen.getByTestId("location").textContent).toContain(
    "direction=desc",
  );
  expect(screen.getByText("00:01:21")).toBeTruthy();
  expect(
    screen
      .getByRole("columnheader", { name: /在线时长/ })
      .getAttribute("aria-sort"),
  ).toBe("descending");
});

it("closes the mobile menu on repeated toggle, Escape, outside click, navigation and resize", async () => {
  const user = userEvent.setup();
  renderNav();
  const toggle = () => screen.getByRole("button", { name: "打开导航菜单" });
  await user.click(toggle());
  expect(
    screen
      .getByRole("button", { name: "关闭导航菜单" })
      .getAttribute("aria-expanded"),
  ).toBe("true");
  await user.click(screen.getByRole("button", { name: "关闭导航菜单" }));
  expect(toggle()).toBeTruthy();
  await user.click(toggle());
  await user.keyboard("{Escape}");
  expect(toggle()).toBeTruthy();
  await user.click(toggle());
  fireEvent.pointerDown(document.body);
  expect(toggle()).toBeTruthy();
  await user.click(toggle());
  await user.click(
    document.querySelector('.archive-mobile-nav a[href="/daily-stats"]'),
  );
  expect(screen.getByTestId("location").textContent).toBe("/daily-stats");
  expect(toggle()).toBeTruthy();
  await user.click(toggle());
  act(() => mediaListeners.forEach((listener) => listener({ matches: true })));
  expect(toggle()).toBeTruthy();
});

it("uses one explicit CSS breakpoint to prevent desktop/mobile menu overlap", () => {
  const root = postcss.parse(readFileSync("resources/css/app.css", "utf8"));
  let found = false;
  root.walkAtRules("media", (rule) => {
    if (rule.params !== "(min-width: 1024px)") return;
    rule.walkRules((child) => {
      if (
        child.selector.replace(/\s/g, "") !==
        ".archive-menu-toggle,.archive-mobile-nav"
      )
        return;
      found = child.nodes.some(
        (node) => node.prop === "display" && node.value === "none",
      );
    });
  });
  expect(found).toBe(true);
});

it("uses CSRF protected native logout in both navigation layouts", async () => {
  const meta = document.createElement("meta");
  meta.name = "csrf-token";
  meta.content = "test-only-token";
  document.head.append(meta);
  renderNav();
  await userEvent.click(screen.getByRole("button", { name: "打开导航菜单" }));
  const forms = document.querySelectorAll('form[action="/logout"]');
  expect(forms.length).toBe(2);
  forms.forEach((form) => {
    expect(form.method).toBe("post");
    expect(form.querySelector('[name="_token"]').value).toBe("test-only-token");
  });
  meta.remove();
});

it("renders login validation messages, preserves username and prevents repeated submit", () => {
  render(
    <MemoryRouter>
      <LoginPage errors={["用户名或密码错误"]} initialUsername="Alex" />
    </MemoryRouter>,
  );
  expect(screen.getByRole("alert").textContent).toContain("用户名或密码错误");
  expect(screen.getByRole("textbox", { name: "用户名" }).value).toBe("Alex");
  const form = document.querySelector("form");
  fireEvent.submit(form);
  expect(screen.getByRole("button", { name: "正在登录…" }).disabled).toBe(true);
  expect(fireEvent.submit(form)).toBe(false);
  act(() => window.dispatchEvent(new Event("pageshow")));
  expect(screen.getByRole("button", { name: "进入管理控制台" }).disabled).toBe(
    false,
  );
});

it("does not fetch protected dashboard data before admin state is confirmed", () => {
  const fetcher = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map(), fetcher }}>
      <MemoryRouter>
        <AdminPage isAdmin={false} />
      </MemoryRouter>
    </SWRConfig>,
  );
  expect(screen.getByText("需要管理员登录")).toBeTruthy();
  expect(fetcher).not.toHaveBeenCalled();
});

it("offers actionable HTTP failure instead of an endless loading skeleton", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
  render(
    <SWRConfig value={{ provider: () => new Map(), fetcher: fetchJson }}>
      <MemoryRouter initialEntries={["/daily-stats?bad=1"]}>
        <ApiPage endpoint="/api/daily-stats" includeSearch>
          {() => <p>records</p>}
        </ApiPage>
      </MemoryRouter>
    </SWRConfig>,
  );
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("加载失败"),
  );
  expect(screen.getByRole("button", { name: "重新加载" })).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "清除筛选条件" }).getAttribute("href"),
  ).toBe("/daily-stats");
});

it("rejects rate limits and invalid JSON while time-stamping only successful server status", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  fetch.mockResolvedValueOnce({ ok: false, status: 429 });
  await expect(fetchJson("/api/chat")).rejects.toThrow("请求过于频繁");
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.reject(new Error()),
  });
  await expect(fetchJson("/api/chat")).rejects.toThrow("无效数据");
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ serverStatus: { is_online: true } }),
  });
  expect((await fetchJson("/api/server-status")).receivedAt).toBeTypeOf(
    "number",
  );
});
