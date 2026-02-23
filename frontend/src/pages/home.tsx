import { Link } from "react-router-dom";
import { Calendar, LayoutGrid, Users, Briefcase, FileText } from "lucide-react";

const quickLinks = [
  { to: "/calendar", label: "Calendar", icon: Calendar, desc: "View your schedule and events" },
  { to: "/structure", label: "Structure Board", icon: LayoutGrid, desc: "Visual workflow canvas" },
  { to: "/team", label: "Team", icon: Users, desc: "Manage your team" },
  { to: "/employee", label: "Dashboard", icon: Briefcase, desc: "Your personal workspace" },
  { to: "/submissions", label: "Submissions", icon: FileText, desc: "Review reports and ratings" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <div className="flex flex-col items-center">
        <pre className="font-mono text-[0.55rem] sm:text-xs leading-tight text-center mb-6 whitespace-pre select-none text-foreground/80">
{`██████╗ ██╗      █████╗ ███╗   ██╗███╗   ██╗███████╗██████╗
██╔══██╗██║     ██╔══██╗████╗  ██║████╗  ██║██╔════╝██╔══██╗
██████╔╝██║     ███████║██╔██╗ ██║██╔██╗ ██║█████╗  ██████╔╝
██╔═══╝ ██║     ██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██╔══██╗
██║     ███████╗██║  ██║██║ ╚████║██║ ╚████║███████╗██║  ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝`}
        </pre>

        <p className="text-muted-foreground text-center text-xs sm:text-sm mb-10">
          V: 3.1.3
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl w-full">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card/40 hover:bg-card/80 hover:border-foreground/20 transition-all duration-300"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary/70 group-hover:text-primary transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
