// Import wouter from our compatibility layer
const { Link, useLocation } = require("../wouter-compat");
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Brain, 
  MessageSquare, 
  Heart, 
  History, 
  Plug, 
  Settings,
  BarChart3
} from "lucide-react";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [location] = useLocation();

  interface StatusResponse {
    ollama?: {
      status: string;
      endpoint?: string;
      error?: string;
    };
    oura?: {
      status: string;
      configured: boolean;
      error?: string;
    };
    ai?: {
      provider: string;
      status: string;
      error?: string;
    };
  }

  const { data: status } = useQuery<StatusResponse>({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });

  const navItems = [
    { 
      path: '/', 
      icon: BarChart3, 
      label: 'Dashboard',
      active: location === '/'
    },
    { 
      path: '/chat', 
      icon: MessageSquare, 
      label: 'Chat',
      active: location.startsWith('/chat')
    },
    { 
      path: '/health', 
      icon: Heart, 
      label: 'Health Data',
      active: location === '/health'
    },
    { 
      path: '/integrations', 
      icon: Plug, 
      label: 'Integrations',
      active: location === '/integrations'
    },
    { 
      path: '/history', 
      icon: History, 
      label: 'History',
      active: location === '/history'
    },
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Settings',
      active: location === '/settings'
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Cognos</h1>
            <p className="text-sm text-slate-500">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <div 
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  item.active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={onNavigate}
              >
                <Icon className="h-5 w-5" />
                <span className={item.active ? 'font-medium' : ''}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-slate-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Ollama Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status?.ollama?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <Badge variant={status?.ollama?.status === 'connected' ? 'default' : 'destructive'} className="text-xs">
                {status?.ollama?.status === 'connected' ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Oura Ring</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status?.oura?.status === 'connected' ? 'bg-green-500' : 'bg-slate-400'
              }`}></div>
              <Badge variant={status?.oura?.status === 'connected' ? 'default' : 'secondary'} className="text-xs">
                {status?.oura?.status === 'connected' ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Memory</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
