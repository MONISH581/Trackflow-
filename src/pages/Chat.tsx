import React from "react";
import { useStore, MessageInfo, ProjectInfo } from "../store.ts";
import { Send, Hash, Shield, Sparkles, FolderDot, MessageSquare, Trash2, MoreVertical, X, CheckCheck, Clock } from "lucide-react";

export default function Chat() {
  const {
    messages,
    activeProject,
    projects,
    currentUser,
    socket,
    fetchMessages,
    sendMessage,
    deleteMessage,
    fetchProjects,
  } = useStore();

  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("global");
  const [inputText, setInputText] = React.useState("");
  const [selectedMsgForDelete, setSelectedMsgForDelete] = React.useState<MessageInfo | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const touchTimerRef = React.useRef<any>(null);

  const studentProjectId = activeProject ? (activeProject._id || activeProject.id) : "";

  // Load project workspaces on Coordinator login
  React.useEffect(() => {
    if (currentUser?.role === "coordinator") {
      fetchProjects();
    }
  }, [currentUser, fetchProjects]);

  // Switch Room handles Socket room transitions
  React.useEffect(() => {
    const pId = selectedRoomId === "global" ? "" : selectedRoomId;
    fetchMessages(pId);

    if (socket && selectedRoomId !== "global") {
      socket.emit("join_project", selectedRoomId);
    }

    return () => {
      if (socket && selectedRoomId !== "global") {
        socket.emit("leave_project", selectedRoomId);
      }
    };
  }, [selectedRoomId, socket, fetchMessages]);

  // Scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");
    const pId = selectedRoomId === "global" ? "" : selectedRoomId;
    await sendMessage(textToSend, pId);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMsgForDelete) return;
    const msgId = selectedMsgForDelete._id || selectedMsgForDelete.id;
    if (msgId) {
      await deleteMessage(msgId);
    }
    setSelectedMsgForDelete(null);
  };

  const handleTouchStart = (msg: MessageInfo) => {
    touchTimerRef.current = setTimeout(() => {
      if (msg.userId === currentUser?.userId || currentUser?.role === "coordinator" || currentUser?.role === "master_admin") {
        setSelectedMsgForDelete(msg);
      }
    }, 500); // 500ms long press trigger
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: MessageInfo) => {
    e.preventDefault();
    if (msg.userId === currentUser?.userId || currentUser?.role === "coordinator" || currentUser?.role === "master_admin") {
      setSelectedMsgForDelete(msg);
    }
  };

  // Find active room info details
  const getActiveRoomInfo = () => {
    if (selectedRoomId === "global") {
      return {
        title: "Global Chat Room",
        description: "Open discussion across all coordinators, students & departments",
        icon: Shield,
        color: "text-blue-600 bg-blue-50 border-blue-200/50",
      };
    }
    
    // Find project
    const currentProj = projects.find(p => (p.id === selectedRoomId || p._id === selectedRoomId)) || activeProject;
    return {
      title: currentProj ? `Team: ${currentProj.name}` : "Project Team Channel",
      description: currentProj ? `Private messaging board for ${currentProj.department}` : "Private messaging board restricted to project members",
      icon: Hash,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    };
  };

  const roomInfo = getActiveRoomInfo();

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] flex flex-col md:flex-row gap-4 md:gap-5">
      {/* Discussion Rooms List */}
      <div className="w-full md:w-72 flex flex-col gap-2 shrink-0">
        <div className="glass-card p-3 sm:p-4 border border-blue-200/40 space-y-2 md:space-y-4 flex flex-col md:h-full overflow-hidden text-left">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:block">
            Discussion Channels
          </h3>

          <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar md:overflow-y-auto pb-1 md:pb-0 max-w-full">
            {/* Global Room */}
            <button
              onClick={() => setSelectedRoomId("global")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 md:w-full ${
                selectedRoomId === "global"
                  ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 bg-slate-50 border-slate-200/50 hover:bg-slate-100/60"
              }`}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Global Room</span>
            </button>

            {/* Coordinator list of all projects */}
            {currentUser?.role === "coordinator" || currentUser?.role === "master_admin" ? (
              projects.map((proj) => {
                const projId = proj._id || proj.id || "";
                const isSelected = selectedRoomId === projId;
                return (
                  <button
                    key={projId}
                    onClick={() => setSelectedRoomId(projId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 md:w-full ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                        : "text-slate-600 hover:text-slate-800 bg-slate-50 border-slate-200/50 hover:bg-slate-100/60"
                    }`}
                  >
                    <FolderDot className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-left max-w-[min(100%,_140px)] md:max-w-none">{proj.name}</span>
                  </button>
                );
              })
            ) : (
              // Student active project team room
              studentProjectId && (
                <button
                  onClick={() => setSelectedRoomId(studentProjectId)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 md:w-full ${
                    selectedRoomId === studentProjectId
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "text-slate-600 hover:text-slate-800 bg-slate-50 border-slate-200/50 hover:bg-slate-100/60"
                  }`}
                >
                  <Hash className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-left">Project Team Room</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Messaging Hub */}
      <div className="flex-1 glass-card border border-blue-200/40 flex flex-col justify-between overflow-hidden shadow-sm relative">
        {/* Room Info Header */}
        <div className="p-4 border-b border-blue-200/35 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${roomInfo.color}`}>
              <roomInfo.icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-800 leading-tight">
                {roomInfo.title}
              </h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {roomInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Chat History Panel */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
              <MessageSquare className="w-8 h-8 text-blue-400 animate-pulse" />
              <p className="text-xs font-semibold">Discussion started. Send the first message!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwnMessage = msg.userId === currentUser?.userId;
              const canDelete = isOwnMessage || currentUser?.role === "coordinator" || currentUser?.role === "master_admin";

              return (
                <div
                  key={idx}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group relative`}
                >
                  <div
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                    onTouchStart={() => handleTouchStart(msg)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(msg)}
                    onMouseUp={handleTouchEnd}
                    className={`max-w-[75%] p-3.5 rounded-2xl text-xs text-left border shadow-sm relative transition-all duration-150 select-none cursor-pointer ${
                      isOwnMessage
                        ? "bg-blue-600 text-white border-blue-500 rounded-br-none hover:bg-blue-700"
                        : "bg-white border-slate-200 text-slate-800 rounded-bl-none hover:bg-slate-50"
                    }`}
                  >
                    {!isOwnMessage && (
                      <span className="font-bold text-blue-600 block mb-1 text-xs">
                        {msg.user}
                      </span>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</p>
                    <div className="flex items-center justify-between gap-2 mt-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs block leading-none ${isOwnMessage ? 'text-blue-200' : 'text-slate-400'}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwnMessage && (
                          <span className="text-xs text-blue-200 flex items-center gap-0.5" title={msg.status === 'sending' ? 'Sending message...' : 'Sent successfully'}>
                            {msg.status === 'sending' ? (
                              <Clock className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <CheckCheck className="w-3 h-3 text-blue-100" />
                            )}
                          </span>
                        )}
                      </div>

                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMsgForDelete(msg);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ${
                            isOwnMessage ? "text-blue-200 hover:text-white hover:bg-blue-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                          }`}
                          title="Long press or right-click to delete message (WhatsApp style)"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp Style Delete Confirmation Modal Popup */}
        {selectedMsgForDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete message?</span>
                </div>
                <button
                  onClick={() => setSelectedMsgForDelete(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Message by {selectedMsgForDelete.user}:
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-3 font-sans italic">
                  "{selectedMsgForDelete.text}"
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                This message will be permanently deleted for all members in real-time.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedMsgForDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete for everyone</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Input Footer */}
        <form onSubmit={handleSend} className="p-4 border-t border-blue-200/35 flex gap-3 bg-slate-50/40">
          <input
            type="text"
            placeholder={`Message ${selectedRoomId === "global" ? "#global-chat" : "#project-team"}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl glass-input text-xs"
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-lg shadow-blue-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

