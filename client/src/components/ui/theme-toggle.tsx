import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { useTheme } from "../theme-provider"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="glass-button text-white hover:text-white px-3 py-2">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card">
        <DropdownMenuItem onClick={() => setTheme("light")} className="font-semibold uppercase tracking-wide">
          <Sun className="h-4 w-4 mr-2" />
          LIGHT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="font-semibold uppercase tracking-wide">
          <Moon className="h-4 w-4 mr-2" />
          DARK
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="font-semibold uppercase tracking-wide">
          <Monitor className="h-4 w-4 mr-2" />
          SYSTEM
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}