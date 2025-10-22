import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeEvents } from '@/lib/realtime-events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Ban,
  Play,
  Calendar,
  Bell,
  Settings,
  History,
  FileText
} from 'lucide-react';
import {
  getAllUsers,
  updateUserStatus,
  getAllChallenges,
  updateChallengeStatus,
  getAllProfiles,
  validateExpertProfile,
  getAllMatches,
  getMatchingConfig,
  saveMatchingConfig,
  createMatchingEvent,
  updateMatchingEvent,
  getAllMatchingEvents,
  createNotification,
  getAllNotifications
} from '@/lib/db-operations';
import type { User, Challenge, ExpertProfile, Match, MatchingConfig, MatchingEvent, Notification } from '@/lib/db';
import { executeMatching } from '@/lib/db-operations-matching';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Stats
  const [users, setUsers] = useState<User[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [profiles, setProfiles] = useState<ExpertProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Matching
  const [matchingConfig, setMatchingConfig] = useState<MatchingConfig>({
    id: 'default',
    weights: {
      expertise: 0.4,
      budget: 0.3,
      deadline: 0.2,
      availability: 0.1,
    },
    threshold: 0.6,
    categories: ['Tecnología', 'Sostenibilidad', 'Salud', 'Educación', 'Infraestructura'],
    updatedAt: Date.now(),
  });
  const [matchingEvents, setMatchingEvents] = useState<MatchingEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form states
  const [scheduledTime, setScheduledTime] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifRole, setNotifRole] = useState<'all' | 'empresa' | 'experto'>('all');

  const loadData = async () => {
    try {
      const [usersData, challengesData, profilesData, matchesData, configData, eventsData, notifsData] = await Promise.all([
        getAllUsers(),
        getAllChallenges(),
        getAllProfiles(),
        getAllMatches(),
        getMatchingConfig(),
        getAllMatchingEvents(),
        getAllNotifications()
      ]);

      setUsers(usersData);
      setChallenges(challengesData);
      setProfiles(profilesData);
      setMatches(matchesData);
      if (configData) {
        setMatchingConfig(configData);
      }
      setMatchingEvents(eventsData);
      setNotifications(notifsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadData();

    // Escuchar eventos en tiempo real
    const unsubscribeChallenge = realtimeEvents.on('challenge-created', () => {
      loadData();
    });

    const unsubscribeChallengeUpdate = realtimeEvents.on('challenge-updated', () => {
      loadData();
    });

    const unsubscribeMatch = realtimeEvents.on('match-created', () => {
      loadData();
    });

    const unsubscribeMatchUpdate = realtimeEvents.on('match-updated', () => {
      loadData();
    });

    // Limpiar listeners al desmontar
    return () => {
      unsubscribeChallenge();
      unsubscribeChallengeUpdate();
      unsubscribeMatch();
      unsubscribeMatchUpdate();
    };
  }, []);

  const handleUserAction = async (userId: string, status: User['status']) => {
    try {
      await updateUserStatus(userId, status);
      await loadData();
      toast({
        title: 'Usuario actualizado',
        description: `Estado cambiado a: ${status}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario',
        variant: 'destructive'
      });
    }
  };

  const handleChallengeValidation = async (challengeId: string, status: Challenge['status']) => {
    try {
      await updateChallengeStatus(challengeId, status);
      await loadData();
      toast({
        title: 'Reto actualizado',
        description: `Estado cambiado a: ${status}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el reto',
        variant: 'destructive'
      });
    }
  };

  const handleProfileValidation = async (userId: string, validated: boolean) => {
    try {
      await validateExpertProfile(userId, validated);
      await loadData();
      toast({
        title: validated ? 'Perfil validado' : 'Validación removida',
        description: 'Perfil actualizado correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo validar el perfil',
        variant: 'destructive'
      });
    }
  };

  const handleSaveConfig = async () => {
    try {
      await saveMatchingConfig(matchingConfig);
      toast({
        title: 'Configuración guardada',
        description: 'Los parámetros de matching han sido actualizados'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    }
  };

  const handleStartMatching = async () => {
    if (!matchingConfig) {
      toast({
        title: 'Error',
        description: 'No hay configuración de matching',
        variant: 'destructive'
      });
      return;
    }

    try {
      const event = await createMatchingEvent({
        status: 'running',
        startedAt: Date.now(),
        matchesCreated: 0,
        createdBy: user!.id
      });

      toast({
        title: 'Matching iniciado',
        description: 'El proceso de matching está en curso...'
      });

      // Execute real matching algorithm
      const result = await executeMatching(matchingConfig.weights, matchingConfig.threshold);

      await updateMatchingEvent(event.id, {
        status: result.success ? 'completed' : 'failed',
        completedAt: Date.now(),
        matchesCreated: result.matchesCreated
      });

      await loadData();

      if (result.success) {
        toast({
          title: 'Matching completado',
          description: `Se crearon ${result.matchesCreated} matches potenciales basados en categorías`
        });
      } else {
        toast({
          title: 'Matching completado con advertencias',
          description: result.errors.join(', '),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el matching',
        variant: 'destructive'
      });
    }
  };

  const handleScheduleMatching = async () => {
    if (!scheduledTime) {
      toast({
        title: 'Error',
        description: 'Selecciona una fecha y hora',
        variant: 'destructive'
      });
      return;
    }

    try {
      const scheduledTimestamp = new Date(scheduledTime).getTime();
      await createMatchingEvent({
        status: 'scheduled',
        scheduledAt: scheduledTimestamp,
        matchesCreated: 0,
        createdBy: user!.id
      });

      await loadData();
      setScheduledTime('');
      toast({
        title: 'Matching programado',
        description: `Se ejecutará el ${new Date(scheduledTimestamp).toLocaleString()}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo programar el matching',
        variant: 'destructive'
      });
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle || !notifMessage) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createNotification({
        title: notifTitle,
        message: notifMessage,
        targetRole: notifRole === 'all' ? undefined : notifRole,
        createdBy: user!.id
      });

      await loadData();
      setNotifTitle('');
      setNotifMessage('');
      setNotifRole('all');

      const targetText = notifRole === 'all' ? 'todos los usuarios' : `usuarios de tipo ${notifRole}`;
      toast({
        title: 'Notificación enviada',
        description: `Enviada a ${targetText}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación',
        variant: 'destructive'
      });
    }
  };

  const stats = [
    { 
      label: 'Usuarios Activos', 
      value: users.filter(u => u.status === 'approved').length, 
      icon: Users, 
      color: 'text-primary' 
    },
    { 
      label: 'Empresas', 
      value: users.filter(u => u.role === 'empresa').length, 
      icon: Building2, 
      color: 'text-secondary' 
    },
    { 
      label: 'Expertos', 
      value: users.filter(u => u.role === 'experto').length, 
      icon: GraduationCap, 
      color: 'text-accent' 
    },
    { 
      label: 'Matches Totales', 
      value: matches.filter(m => m.status === 'matched').length, 
      icon: TrendingUp, 
      color: 'text-primary' 
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-muted-foreground">Control total del sistema y gestión de usuarios</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-elegant hover:shadow-glow transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <FileText className="w-4 h-4 mr-2" />
            Retos
          </TabsTrigger>
          <TabsTrigger value="profiles">
            <GraduationCap className="w-4 h-4 mr-2" />
            Perfiles
          </TabsTrigger>
          <TabsTrigger value="matching">
            <Play className="w-4 h-4 mr-2" />
            Matching
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Aprobar, suspender o eliminar usuarios del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(u => u.role !== 'admin').map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'empresa' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          u.status === 'approved' ? 'default' :
                          u.status === 'pending' ? 'secondary' :
                          u.status === 'suspended' ? 'destructive' : 'outline'
                        }>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        {u.status !== 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUserAction(u.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                        )}
                        {u.status !== 'suspended' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUserAction(u.id, 'suspended')}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspender
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleUserAction(u.id, 'deleted')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validación de Retos</CardTitle>
              <CardDescription>Revisar y validar los retos publicados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.category}</TableCell>
                      <TableCell>{c.budget}</TableCell>
                      <TableCell>
                        <Badge variant={
                          c.status === 'active' ? 'default' :
                          c.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        {c.status !== 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleChallengeValidation(c.id, 'active')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleChallengeValidation(c.id, 'completed')}
                        >
                          Completar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfiles de Expertos</CardTitle>
              <CardDescription>Validar perfiles científicos y profesionales</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Experticia</TableHead>
                    <TableHead>Experiencia</TableHead>
                    <TableHead>Validado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => {
                    const expertUser = users.find(u => u.id === p.userId);
                    return (
                      <TableRow key={p.userId}>
                        <TableCell>{expertUser?.name || 'N/A'}</TableCell>
                        <TableCell>{p.expertise.join(', ')}</TableCell>
                        <TableCell>{p.experience}</TableCell>
                        <TableCell>
                          <Badge variant={p.validated ? 'default' : 'secondary'}>
                            {p.validated ? 'Validado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!p.validated ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleProfileValidation(p.userId, true)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Validar
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleProfileValidation(p.userId, false)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Remover
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar Matching</CardTitle>
                <CardDescription>Ejecutar el proceso de matching manualmente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleStartMatching} className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Ahora
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Programar Matching</CardTitle>
                <CardDescription>Establecer fecha y hora de ejecución</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
                <Button onClick={handleScheduleMatching} className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Programar
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <History className="w-4 h-4 inline mr-2" />
                Historial de Eventos
              </CardTitle>
              <CardDescription>Registro de procesos de matching ejecutados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Programado</TableHead>
                    <TableHead>Iniciado</TableHead>
                    <TableHead>Completado</TableHead>
                    <TableHead>Matches Creados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge variant={
                          event.status === 'completed' ? 'default' :
                          event.status === 'running' ? 'secondary' :
                          event.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.scheduledAt ? new Date(event.scheduledAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {event.startedAt ? new Date(event.startedAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {event.completedAt ? new Date(event.completedAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>{event.matchesCreated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Matching</CardTitle>
              <CardDescription>Ajustar pesos, umbrales y categorías del algoritmo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Pesos de Criterios</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Experticia (0-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={matchingConfig.weights.expertise}
                      onChange={(e) => setMatchingConfig({
                        ...matchingConfig,
                        weights: { ...matchingConfig.weights, expertise: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Presupuesto (0-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={matchingConfig.weights.budget}
                      onChange={(e) => setMatchingConfig({
                        ...matchingConfig,
                        weights: { ...matchingConfig.weights, budget: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plazo (0-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={matchingConfig.weights.deadline}
                      onChange={(e) => setMatchingConfig({
                        ...matchingConfig,
                        weights: { ...matchingConfig.weights, deadline: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Disponibilidad (0-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={matchingConfig.weights.availability}
                      onChange={(e) => setMatchingConfig({
                        ...matchingConfig,
                        weights: { ...matchingConfig.weights, availability: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Umbral de Match (0-1)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={matchingConfig.threshold}
                  onChange={(e) => setMatchingConfig({
                    ...matchingConfig,
                    threshold: parseFloat(e.target.value)
                  })}
                />
              </div>

              <Button onClick={handleSaveConfig} className="w-full">
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Notificación Masiva</CardTitle>
              <CardDescription>Comunicar información a usuarios del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Título de la notificación"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Textarea
                  placeholder="Contenido del mensaje"
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Destinatarios</Label>
                <Select value={notifRole} onValueChange={(value: any) => setNotifRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    <SelectItem value="empresa">Solo empresas</SelectItem>
                    <SelectItem value="experto">Solo expertos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSendNotification} className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                Enviar Notificación
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Notificaciones</CardTitle>
              <CardDescription>Notificaciones enviadas recientemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <Card key={notif.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{notif.title}</CardTitle>
                      <CardDescription>
                        {new Date(notif.createdAt).toLocaleString()} - 
                        {notif.targetRole ? ` ${notif.targetRole}` : ' Todos'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
