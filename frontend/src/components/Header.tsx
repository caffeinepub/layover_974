import { useState } from "react";
import { Plane, Pencil, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { EditNameDialog } from "./EditNameDialog";

export function Header() {
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const { data: profile } = useProfile();
  const { clear: logout } = useInternetIdentity();

  const userName = profile?.name ?? "";

  return (
    <>
      <header className="container mx-auto px-4 lg:px-0 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <Plane className="w-5 h-5 text-primary" />
          <span className="text-lg font-medium tracking-tight text-foreground">
            Layover
          </span>
        </div>
        {userName && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Welcome back, {userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditNameDialogOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit Name
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {userName && (
        <EditNameDialog
          open={editNameDialogOpen}
          onOpenChange={setEditNameDialogOpen}
          currentName={userName}
        />
      )}
    </>
  );
}
