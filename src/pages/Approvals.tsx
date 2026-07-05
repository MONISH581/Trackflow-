import React from "react";
import { useStore, UserInfo } from "../store.ts";
import { Check, X, ShieldAlert, Clock, GraduationCap } from "lucide-react";

export default function Approvals() {
  const { fetchApprovals, approveStudent } = useStore();
  const [requests, setRequests] = React.useState<UserInfo[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadRequests = async () => {
    setLoading(true);
    const data = await fetchApprovals();
    setRequests(data);
    setLoading(false);
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (studentId: string, approve: boolean) => {
    const success = await approveStudent(studentId, approve);
    if (success) {
      loadRequests();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pending Registrations</h2>
          <p className="text-sm text-slate-500 font-medium">
            Review and approve official student accounts waiting to join TrackFlow.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="glass-card p-12 text-center border border-blue-200/40 max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-600 border border-blue-200/50">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-800">All Caught Up!</h3>
          <p className="text-sm text-slate-500">
            There are currently no student registration requests pending coordinator review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((request) => (
            <div
              key={request.userId}
              className="glass-card p-5 border border-blue-200/35 flex flex-col justify-between shadow-sm"
            >
              <div className="flex gap-4">
                <img
                  src={request.avatar}
                  alt={request.name}
                  className="w-14 h-14 rounded-xl ring-2 ring-blue-500/10 object-cover"
                />
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200/40">
                    Year {request.year}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base">{request.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{request.email}</p>
                  <p className="text-xs text-blue-600 font-bold">{request.department}</p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200/60 pt-4 mt-5">
                <button
                  onClick={() => handleAction(request.userId, false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100/70 text-rose-700 border border-rose-200/60 hover:border-rose-300 rounded-xl text-xs font-bold transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleAction(request.userId, true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
