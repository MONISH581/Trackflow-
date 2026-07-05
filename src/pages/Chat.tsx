import React from "react";
import { useStore, MessageInfo, ProjectInfo } from "../store.ts";
import { Send, Hash, Shield, Sparkles, FolderDot, MessageSquare } from "lucide-react";

export default function Chat() {
  const {
    messages,
    activeProject,
    projects,
    currentUser,
    socket,
    fetchMessages,
    sendMessage,
    fetchProjects,
  } = useStore();

  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("global");
  const [inputText, setInputText] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

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

    const pId = selectedRoomId === "global" ? "" : selectedRoomId;
    await sendMessage(inputText, pId);
    setInputText("");
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
    <div className="h-[calc(100vh-180px)] flex flex-col md:flex-row gap-5">
      {/* Discussion Rooms List */}
      <div className="w-full md:w-72 flex flex-col gap-3">
        <div className="glass-card p-4 border border-blue-200/40 space-y-4 flex flex-col h-full overflow-hidden text-left">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Discussion Channels
          </h3>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {/* Global Room */}
            <button
              onClick={() => setSelectedRoomId("global")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all border ${
                selectedRoomId === "global"
                  ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 bg-slate-50 border-slate-200/50 hover:bg-slate-100/60"
              }`}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Global Room</span>
            </button>

            <div className="border-t border-slate-200/60 pt-3 my-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                {currentUser?.role === "coordinator" ? "Workspace Channels" : "My Workspace"}
              </span>
            </div>

            {/* Coordinator list of all projects */}
            {currentUser?.role === "coordinator" ? (
              projects.map((proj) => {
                const projId = proj._id || proj.id || "";
                const isSelected = selectedRoomId === projId;
                return (
                  <button
                    key={projId}
                    onClick={() => setSelectedRoomId(projId)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                        : "text-slate-600 hover:text-slate-800 bg-slate-50 border-slate-200/50 hover:bg-slate-100/60"
                    }`}
                  >
                    <FolderDot className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-left">{proj.name}</span>
                  </button>
                );
              })
            ) : (
              // Student active project team room
              studentProjectId && (
                <button
                  onClick={() => setSelectedRoomId(studentProjectId)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all border ${
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
      <div className="flex-1 glass-card border border-blue-200/40 flex flex-col justify-between overflow-hidden shadow-sm">
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
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
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
              return (
                <div
                  key={idx}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3.5 rounded-2xl text-xs text-left border shadow-sm ${
                      isOwnMessage
                        ? "bg-blue-600 text-white border-blue-500 rounded-br-none"
                        : "bg-white border-slate-200 border-slate-200 text-slate-800 rounded-bl-none"
                    }`}
                  >
                    {!isOwnMessage && (
                      <span className="font-bold text-blue-600 block mb-1 text-[10px]">
                        {msg.user}
                      </span>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</p>
                    <span className={`text-[9px] block text-right mt-1.5 leading-none ${isOwnMessage ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

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
