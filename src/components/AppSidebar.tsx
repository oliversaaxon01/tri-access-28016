import { Home, LayoutDashboard, LogOut, Users, Building2, GraduationCap } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getMenuItems = () => {
    if (!user) {
      return [];
    }

    const baseItems = [
      { title: 'Inicio', url: '/', icon: Home },
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    ];

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { title: 'Usuarios', url: '/dashboard/users', icon: Users },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return Users;
      case 'empresa':
        return Building2;
      case 'experto':
        return GraduationCap;
      default:
        return Users;
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrador';
      case 'empresa':
        return 'Empresa';
      case 'experto':
        return 'Experto';
      default:
        return 'Usuario';
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        {user && (
          <div className="px-4 py-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                <RoleIcon className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60">{getRoleLabel()}</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
