import { useChatStore } from '../store/chatStore';

const roleLabel: Record<string, string> = {
  backend: 'Backend',
  dba: 'DBA',
  network: 'Network',
  frontend: 'Frontend',
  devops: 'DevOps',
};

export function Sidebar() {
  const { team, activeChannel, setActiveChannel, unreadCounts, clearUnread, wsConnected } =
    useChatStore();

  const select = (id: string) => {
    setActiveChannel(id);
    clearUnread(id);
  };

  return (
    <aside className="w-56 bg-slack-sidebar flex flex-col flex-shrink-0 border-r border-slack-border">
      {/* Workspace header */}
      <div className="px-4 py-3 border-b border-slack-border">
        <div className="text-white font-medium text-sm flex items-center gap-2">
          <span className="text-lg">✈</span> DevOps Simulator
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className="text-slack-muted text-xs">
            {wsConnected ? 'WS bağlı' : 'WS bağlanıyor...'}
          </span>
        </div>
      </div>

      {/* Kanallar */}
      <div className="pt-3 pb-1">
        <p className="px-4 text-slack-muted text-xs font-semibold uppercase tracking-wider mb-1">
          Kanallar
        </p>
        <button
          onClick={() => select('general')}
          className={`w-full flex items-center gap-2 px-4 py-1.5 text-sm text-left
            ${activeChannel === 'general'
              ? 'bg-slack-sidebarAct text-white'
              : 'text-slack-text hover:bg-slack-sidebarHov hover:text-white'}`}
        >
          <span className="text-slack-muted">#</span> general
          {(unreadCounts['general'] ?? 0) > 0 && (
            <span className="ml-auto bg-slack-alert text-white text-xs font-bold px-1.5 rounded-full">
              {unreadCounts['general']}
            </span>
          )}
        </button>
      </div>

      {/* Direkt mesajlar */}
      <div className="border-t border-slack-border pt-3 flex-1">
        <p className="px-4 text-slack-muted text-xs font-semibold uppercase tracking-wider mb-1">
          Direkt Mesajlar
        </p>
        {team.map((member) => (
          <button
            key={member.id}
            onClick={() => select(member.id)}
            className={`w-full flex items-center gap-2 px-4 py-1.5 text-sm text-left relative
              ${activeChannel === member.id
                ? 'bg-slack-sidebarAct text-white'
                : 'text-slack-text hover:bg-slack-sidebarHov hover:text-white'}`}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: member.avatarColor, color: member.textColor }}
            >
              {member.initials.slice(0, 1)}
            </div>
            <span className="truncate">{member.name}</span>
            {member.online && (
              <span className="w-2 h-2 bg-green-400 rounded-full ml-auto flex-shrink-0" />
            )}
            {(unreadCounts[member.id] ?? 0) > 0 && (
              <span className="ml-auto bg-slack-alert text-white text-xs font-bold px-1.5 rounded-full">
                {unreadCounts[member.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Kendi bilgisi */}
      <div className="border-t border-slack-border px-4 py-3 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
          style={{ background: '#2a1a2a', color: '#de7ade' }}
        >
          S
        </div>
        <div>
          <p className="text-white text-xs font-medium">Sen</p>
          <p className="text-slack-muted text-xs">{roleLabel['devops']}</p>
        </div>
      </div>
    </aside>
  );
}