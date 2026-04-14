import React, { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Star,
  Sun,
  Terminal,
  Edit2,
  Trash2,
  Save,
  Plus,
  X,
  Server,
} from "lucide-react";

export default function Admin() {
  const [data, setData] = useState({ categories: {}, commands: [] });
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true); // <-- Proper loading state

  // Tag Editing State (Universal Rename)
  const [editingTag, setEditingTag] = useState(null); // { group, oldName, newName }

  // Command Editing State
  const [editingCommandId, setEditingCommandId] = useState(null);
  const [cmdDraft, setCmdDraft] = useState(null);
  const [showTagPicker, setShowTagPicker] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/api/data")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false); // Stop loading when data arrives, even if empty
      })
      .catch(() => {
        setStatus("Failed to load. Is admin server running?");
        setIsLoading(false);
      });
  }, []);

  const handleSaveToServer = async () => {
    setStatus("Saving to data.json...");
    try {
      await fetch("http://localhost:3001/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus("Saved successfully!");
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus("Error saving data.");
    }
  };

  // ==========================================
  // UNIVERSAL CATEGORY MANAGEMENT
  // ==========================================
  const handleAddCategoryGroup = () => {
    const newName = prompt(
      "Enter new category group name (e.g., 'Target OS:'):",
    );
    if (newName && !data.categories[newName]) {
      setData({
        ...data,
        categories: { ...data.categories, [newName]: [] },
      });
    }
  };

  const handleAddTagToGroup = (groupKey) => {
    const newTag = prompt(`Add a new tag to "${groupKey}":`);
    if (newTag && !data.categories[groupKey].includes(newTag)) {
      const newData = { ...data };
      newData.categories[groupKey] = [...newData.categories[groupKey], newTag];
      setData(newData);
    }
  };

  const submitTagRename = () => {
    if (!editingTag.newName || editingTag.newName === editingTag.oldName) {
      setEditingTag(null);
      return;
    }

    const { group, oldName, newName } = editingTag;
    const newData = { ...data };

    // 1. Rename in categories
    newData.categories[group] = newData.categories[group].map((t) =>
      t === oldName ? newName : t,
    );

    // 2. Rename universally in all commands
    newData.commands = newData.commands.map((cmd) => ({
      ...cmd,
      tags: cmd.tags.map((t) => (t === oldName ? newName : t)),
    }));

    setData(newData);
    setEditingTag(null);
  };

  const handleDeleteTag = (group, tagToDelete) => {
    if (!window.confirm(`Delete tag "${tagToDelete}" completely?`)) return;

    const newData = { ...data };
    newData.categories[group] = newData.categories[group].filter(
      (t) => t !== tagToDelete,
    );
    newData.commands = newData.commands.map((cmd) => ({
      ...cmd,
      tags: cmd.tags.filter((t) => t !== tagToDelete),
    }));

    setData(newData);
  };

  const handleDeleteCategoryGroup = (groupKey) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the entire "${groupKey}" group?`,
      )
    )
      return;
    const newData = { ...data };
    delete newData.categories[groupKey];
    setData(newData);
  };

  // ==========================================
  // COMMAND MANAGEMENT
  // ==========================================
  const handleAddNewCommand = () => {
    const newId =
      data.commands.length > 0
        ? Math.max(...data.commands.map((c) => c.id)) + 1
        : 1;
    const newCmd = { id: newId, description: "", command: "", tags: [] };
    setData({ ...data, commands: [newCmd, ...data.commands] });
    setEditingCommandId(newId);
    setCmdDraft(newCmd);
  };

  const handleSaveCommand = () => {
    setData({
      ...data,
      commands: data.commands.map((c) => (c.id === cmdDraft.id ? cmdDraft : c)),
    });
    setEditingCommandId(null);
    setCmdDraft(null);
    setShowTagPicker(false);
  };

  const handleDeleteCommand = (id) => {
    if (window.confirm("Delete this command?")) {
      setData({ ...data, commands: data.commands.filter((c) => c.id !== id) });
    }
  };

  // ==========================================
  // DRAFT TAG MANAGEMENT (Inside Command Editor)
  // ==========================================
  const addTagToDraft = (tagToAdd) => {
    if (!cmdDraft.tags.includes(tagToAdd)) {
      setCmdDraft({ ...cmdDraft, tags: [...cmdDraft.tags, tagToAdd] });
    }
    setShowTagPicker(false);
  };

  const removeTagFromDraft = (tagToRemove) => {
    setCmdDraft({
      ...cmdDraft,
      tags: cmdDraft.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleCreateNewTagForDraft = () => {
    const newTag = prompt("Enter new tag name:");
    if (!newTag) return;

    const groups = Object.keys(data.categories);
    if (groups.length === 0) {
      alert("Please create a Category Group first!");
      return;
    }

    const groupString = groups.map((g, i) => `${i + 1}: ${g}`).join("\n");
    const groupSelection = prompt(
      `Which group does "${newTag}" belong to?\n\n${groupString}\n\nEnter the number:`,
    );

    const groupIndex = parseInt(groupSelection) - 1;
    if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= groups.length) {
      alert("Invalid group. Tag creation cancelled.");
      return;
    }

    const selectedGroup = groups[groupIndex];

    // Add to universal categories
    const newData = { ...data };
    if (!newData.categories[selectedGroup].includes(newTag)) {
      newData.categories[selectedGroup] = [
        ...newData.categories[selectedGroup],
        newTag,
      ];
      setData(newData);
    }

    // Add to current draft
    addTagToDraft(newTag);
  };

  // Filtering for display
  const filteredCommands = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return data.commands.filter(
      (item) =>
        item.description.toLowerCase().includes(searchLower) ||
        item.command.toLowerCase().includes(searchLower) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }, [searchTerm, data.commands]);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#2b2d31] text-white p-10 flex items-center justify-center text-2xl font-bold">
        Loading Admin...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#2b2d31] text-gray-300 font-sans selection:bg-yellow-500/30 pb-20">
      {/* FIXED ADMIN ACTION BAR */}
      <div className="sticky top-0 z-50 bg-[#1e1f22] border-b border-yellow-500/50 py-3 px-6 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Server className="text-yellow-500" size={24} />
          <h1 className="text-xl font-bold text-white">
            Admin <span className="text-yellow-500">Mode</span>
          </h1>
          {status && (
            <span className="text-green-400 text-sm ml-4 font-medium animate-pulse">
              {status}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddNewCommand}
            className="flex items-center gap-2 bg-[#2b2d31] border border-gray-600 text-white px-4 py-2 rounded font-semibold hover:border-yellow-500 transition-colors"
          >
            <Plus size={16} /> New Command
          </button>
          <button
            onClick={handleSaveToServer}
            className="flex items-center gap-2 bg-yellow-500 text-gray-900 px-6 py-2 rounded font-bold hover:bg-yellow-400 shadow-lg transition-colors"
          >
            <Save size={18} /> Save to data.json
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* --- HEADER (Mocking App.jsx) --- */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-gray-100 tracking-tight">
              Linux<span className="text-yellow-500">Coms</span>
            </h1>
            <div className="flex items-center gap-2 opacity-50 pointer-events-none">
              <button className="flex items-center gap-2 bg-[#1e1f22] border border-gray-600 text-sm px-3 py-1 rounded">
                <Star size={14} /> Star 1,337
              </button>
              <button className="flex items-center gap-2 bg-[#1e1f22] border border-gray-600 text-sm px-3 py-1 rounded uppercase font-semibold text-gray-300">
                Daymode <Sun size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* --- UNIVERSAL FILTER CATEGORIES --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8 mb-10 border border-gray-700 p-6 rounded-md bg-[#1e1f22]">
          <div className="col-span-full mb-2 flex justify-between items-start border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                <Edit2 size={18} /> Manage Categories Universally
              </h2>
              <p className="text-sm text-gray-400">
                Renaming or deleting a tag here updates every command that uses
                it.
              </p>
            </div>
            <button
              onClick={handleAddCategoryGroup}
              className="flex items-center gap-1 text-sm bg-[#2b2d31] border border-gray-600 px-3 py-1.5 rounded hover:border-yellow-500 hover:text-yellow-500 transition-colors"
            >
              <Plus size={14} /> Add Category Group
            </button>
          </div>

          {Object.entries(data.categories).map(([categoryName, tags]) => (
            <div
              key={categoryName}
              className="flex flex-col items-start bg-[#2b2d31] p-4 rounded border border-gray-700/50 relative group"
            >
              <button
                onClick={() => handleDeleteCategoryGroup(categoryName)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
              <h3 className="font-bold text-gray-200 mb-3">{categoryName}</h3>
              <div className="flex flex-wrap justify-start gap-2">
                {tags.map((tag) => {
                  const isEditing =
                    editingTag?.oldName === tag &&
                    editingTag?.group === categoryName;

                  return isEditing ? (
                    <div
                      key={tag}
                      className="flex items-center bg-gray-800 border border-yellow-500 rounded overflow-hidden"
                    >
                      <input
                        autoFocus
                        className="bg-transparent text-white px-2 py-1 text-sm outline-none w-24"
                        value={editingTag.newName}
                        onChange={(e) =>
                          setEditingTag({
                            ...editingTag,
                            newName: e.target.value,
                          })
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && submitTagRename()
                        }
                      />
                      <button
                        onClick={submitTagRename}
                        className="bg-yellow-500 text-gray-900 p-1 hover:bg-yellow-400"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        className="bg-gray-700 text-white p-1 hover:bg-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      key={tag}
                      className="group/tag relative flex items-center"
                    >
                      <div className="px-3 py-1 text-sm rounded border bg-[#1e1f22] border-gray-600 text-gray-400 flex items-center gap-2">
                        {tag}
                        <div className="hidden group-hover/tag:flex gap-1 ml-1 border-l border-gray-600 pl-2">
                          <button
                            onClick={() =>
                              setEditingTag({
                                group: categoryName,
                                oldName: tag,
                                newName: tag,
                              })
                            }
                            className="text-gray-400 hover:text-yellow-400"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(categoryName, tag)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => handleAddTagToGroup(categoryName)}
                  className="px-2 py-1 text-[13px] rounded border border-dashed border-gray-500 text-gray-400 hover:text-yellow-500 hover:border-yellow-500"
                >
                  + Add Tag
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative mb-12">
          <input
            type="text"
            placeholder={`Search among ${data.commands.length} commands...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e1f22] border border-gray-700 text-gray-100 text-[15px] px-4 py-3 rounded-sm shadow-md focus:outline-none focus:ring-1 focus:ring-yellow-500 placeholder-gray-500 font-medium"
          />
        </div>

        {/* --- COMMAND LIST --- */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-200 mb-4">Commands</h2>

          {filteredCommands.length === 0 && !editingCommandId && (
            <div className="text-center py-12 border border-dashed border-gray-600 rounded text-gray-400">
              No commands found. Click "New Command" at the top to create one!
            </div>
          )}

          {filteredCommands.map((item) => {
            const isEditing = editingCommandId === item.id;
            const targetData = isEditing ? cmdDraft : item;

            return (
              <div
                key={item.id}
                className={`flex flex-col gap-2 mb-6 group relative p-3 -mx-3 rounded-md transition-colors ${isEditing ? "bg-[#1e1f22] border border-yellow-500/30" : "hover:bg-[#1e1f22]"}`}
              >
                {/* Action Buttons for Command */}
                {!isEditing && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10 bg-[#1e1f22] p-1 rounded border border-gray-700 shadow-md">
                    <button
                      onClick={() => {
                        setEditingCommandId(item.id);
                        setCmdDraft(item);
                        setShowTagPicker(false);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-400 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCommand(item.id)}
                      className="p-1 text-gray-400 hover:text-red-400 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                {/* Description */}
                {isEditing ? (
                  <input
                    value={targetData.description}
                    onChange={(e) =>
                      setCmdDraft({ ...cmdDraft, description: e.target.value })
                    }
                    className="w-full bg-[#111214] border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                    placeholder="Command description..."
                  />
                ) : (
                  <p className="text-sm text-gray-400 mb-1 pr-20">
                    {targetData.description}
                  </p>
                )}

                {/* Command Block */}
                <div className="relative bg-[#1e1f22] border border-gray-700 rounded-sm flex items-stretch overflow-hidden">
                  {isEditing ? (
                    <textarea
                      value={targetData.command}
                      onChange={(e) =>
                        setCmdDraft({ ...cmdDraft, command: e.target.value })
                      }
                      className="flex-1 p-4 text-[15px] text-yellow-400 font-mono bg-transparent outline-none resize-y min-h-[100px]"
                      placeholder="Enter code here..."
                    />
                  ) : (
                    <code className="flex-1 p-4 text-[15px] text-yellow-400 font-mono overflow-x-auto whitespace-pre-wrap hide-scrollbar font-medium leading-relaxed">
                      {targetData.command}
                    </code>
                  )}

                  {!isEditing && (
                    <button className="px-4 text-gray-400 hover:text-yellow-400 transition-colors flex items-center justify-center flex-shrink-0 border-l border-gray-700 bg-[#1e1f22]">
                      <Copy size={20} />
                    </button>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mt-1 relative">
                  {targetData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 text-[13px] border border-gray-600 text-green-500 px-2 py-0.5 rounded-sm bg-transparent"
                    >
                      {tag}
                      {isEditing && (
                        <button
                          onClick={() => removeTagFromDraft(tag)}
                          className="hover:text-red-400 ml-1"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}

                  {/* Add Tag UI (Only visible in edit mode) */}
                  {isEditing && (
                    <div className="relative">
                      <button
                        onClick={() => setShowTagPicker(!showTagPicker)}
                        className="text-[13px] border border-dashed border-gray-500 text-gray-400 hover:text-yellow-500 hover:border-yellow-500 px-2 py-0.5 rounded-sm flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Category
                      </button>

                      {/* Tag Picker Dropdown */}
                      {showTagPicker && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[#111214] border border-gray-600 rounded-md shadow-2xl z-20 max-h-64 overflow-y-auto">
                          {Object.entries(data.categories).map(
                            ([group, tags]) => {
                              // Only show tags not already selected
                              const availableTags = tags.filter(
                                (t) => !cmdDraft.tags.includes(t),
                              );
                              if (availableTags.length === 0) return null;

                              return (
                                <div
                                  key={group}
                                  className="border-b border-gray-800 last:border-0"
                                >
                                  <div className="px-3 py-1 bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase">
                                    {group}
                                  </div>
                                  {availableTags.map((t) => (
                                    <button
                                      key={t}
                                      onClick={() => addTagToDraft(t)}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-400"
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              );
                            },
                          )}
                          <button
                            onClick={handleCreateNewTagForDraft}
                            className="w-full text-left px-3 py-3 text-sm text-yellow-500 font-bold hover:bg-yellow-500/10 border-t border-gray-700 flex items-center gap-2"
                          >
                            <Plus size={14} /> Create New Tag...
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit Mode Save/Cancel */}
                {isEditing && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                    <button
                      onClick={handleSaveCommand}
                      className="bg-yellow-500 text-gray-900 px-4 py-1.5 rounded text-sm font-bold hover:bg-yellow-400"
                    >
                      Save Item
                    </button>
                    <button
                      onClick={() => {
                        setEditingCommandId(null);
                        setShowTagPicker(false);
                      }}
                      className="bg-transparent border border-gray-600 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
