import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeEvents } from '@/lib/realtime-events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateChallengeDialog } from '@/components/CreateChallengeDialog';
import { SwipeCard } from '@/components/SwipeCard';
import { ChatDialog } from '@/components/ChatDialog';
import { ExpertProfileCard } from '@/components/ExpertProfileCard';
import { MessageSquare, Target, Users, TrendingUp, Bell, Check, X } from 'lucide-react';
import { Challenge, Match, ExpertProfile } from '@/lib/db';
import { 
  getChallengesByEmpresa, 
  getMatchesByEmpresa, 
  createMatch, 
  updateMatch,
  getAllActiveChallenges,
  getChallengeById 
} from '@/lib/db-operations';
import { getExpertsForEmpresa } from '@/lib/db-operations-empresa';
import { db } from '@/lib/db';

const EmpresaDashboard = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ matchId: string; userName: string } | null>(null);
  const [expertNames, setExpertNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();

    // Escuchar eventos en tiempo real
    const unsubscribeMatch = realtimeEvents.on('match-created', () => {
      loadData();
    });

    const unsubscribeMatchUpdate = realtimeEvents.on('match-updated', () => {
      loadData();
    });

    const unsubscribeMessage = realtimeEvents.on('message-created', () => {
      loadData();
    });

    const unsubscribeChallenge = realtimeEvents.on('challenge-created', () => {
      loadData();
    });

    // Limpiar listeners al desmontar
    return () => {
      unsubscribeMatch();
      unsubscribeMatchUpdate();
      unsubscribeMessage();
      unsubscribeChallenge();
    };
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const userChallenges = await getChallengesByEmpresa(user.id);
      setChallenges(userChallenges);

      const allChallenges = await getAllActiveChallenges();
      const otherChallenges = allChallenges.filter(c => c.empresaId !== user.id);
      setAvailableChallenges(otherChallenges);

      const userMatches = await getMatchesByEmpresa(user.id);
      setMatches(userMatches);

      // Get experts matching empresa's challenge categories
      const allCategories = userChallenges.flatMap(c => c.categories || []);
      const uniqueCategories = Array.from(new Set(allCategories));
      const availableExperts = await getExpertsForEmpresa(uniqueCategories);
      setExperts(availableExperts);

      // Load expert names
      const names: Record<string, string> = {};
      const expertIds = [...new Set(userMatches.map(m => m.expertoId))];
      for (const expertId of expertIds) {
        const expertUser = await db.getUserById(expertId);
        if (expertUser) {
          names[expertId] = expertUser.name;
        }
      }
      setExpertNames(names);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSwipe = async (interested: boolean) => {
    if (!user || currentSwipeIndex >= availableChallenges.length) return;

    const challenge = availableChallenges[currentSwipeIndex];

    if (interested) {
      try {
        await createMatch({
          challengeId: challenge.id,
          empresaId: user.id,
          expertoId: challenge.empresaId,
          empresaInterested: true,
          expertoInterested: false,
          status: 'pending',
        });
      } catch (error) {
        console.error('Error creating match:', error);
      }
    }

    setCurrentSwipeIndex(currentSwipeIndex + 1);
  };

  const handleSendMatchRequest = async (matchId: string) => {
    if (!user) return;

    try {
      await updateMatch(matchId, {
        empresaInterested: true,
        status: 'pending',
      });
      await loadData();
    } catch (error) {
      console.error('Error sending match request:', error);
    }
  };

  const handleSendExpertMatch = async (expertId: string, challengeId: string) => {
    if (!user) return;

    try {
      await createMatch({
        challengeId: challengeId,
        empresaId: user.id,
        expertoId: expertId,
        empresaInterested: true,
        expertoInterested: false,
        status: 'pending',
      });
      await loadData();
    } catch (error) {
      console.error('Error sending match:', error);
    }
  };

  const getMatchStatus = (expertId: string): 'none' | 'pending' | 'matched' => {
    const match = matches.find(m => m.expertoId === expertId);
    if (!match) return 'none';
    return match.status === 'matched' ? 'matched' : 'pending';
  };

  const potentialMatches = matches.filter(m => m.status === 'potential');
  const pendingRequests = matches.filter(m => m.status === 'pending' && m.expertoInterested && !m.empresaInterested);
  const confirmedMatches = matches.filter(m => m.status === 'matched');

  const stats = [
    { label: 'Retos Activos', value: challenges.filter(c => c.status === 'active').length.toString(), icon: Target },
    { label: 'Matches', value: confirmedMatches.length.toString(), icon: Users },
    { label: 'En Progreso', value: challenges.filter(c => c.status === 'in_progress').length.toString(), icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel de Empresa</h1>
          <p className="text-muted-foreground">Gestiona tus retos y conecta con expertos</p>
        </div>
        <CreateChallengeDialog empresaId={user!.id} onChallengeCreated={loadData} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-elegant hover:shadow-glow transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="retos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="retos">Mis Retos</TabsTrigger>
          <TabsTrigger value="matches">Matches Potenciales</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="retos" className="space-y-4">
          {challenges.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tienes retos publicados</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primer reto para empezar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'}>
                        {challenge.status === 'active' ? 'Activo' : challenge.status === 'in_progress' ? 'En Progreso' : 'Completado'}
                      </Badge>
                    </div>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{challenge.category}</span>
                      <span>{challenge.budget}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 El admin ha encontrado estos expertos que coinciden con las categorías de tus retos. 
              Revisa sus perfiles y envía solicitudes a los que más te interesen.
            </p>
          </div>
          {potentialMatches.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay matches potenciales</p>
                <p className="text-sm text-muted-foreground mt-2">El admin debe ejecutar el matching primero</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {potentialMatches.map((match) => {
                const expert = experts.find(e => e.userId === match.expertoId);
                const expertName = expertNames[match.expertoId] || 'Experto';
                return (
                  <Card key={match.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>⚙️</span>
                            {expertName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Compatibilidad: {match.matchScore?.toFixed(0)}%
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="ml-2">Match</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {expert ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Sobre el experto:</p>
                            <p className="text-sm text-muted-foreground">{expert.bio || 'Sin biografía'}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Categorías en común:</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.categories.map(cat => (
                                <Badge key={cat} variant="secondary">{cat}</Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>💼 {expert.experience} años exp.</span>
                            <span>💰 {expert.hourlyRate}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Cargando información del experto...</p>
                      )}
                      <Button
                        onClick={() => handleSendMatchRequest(match.id)}
                        className="w-full mt-4"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Enviar Solicitud de Match
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="solicitudes" className="space-y-4">
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🔔 Estas son las solicitudes de expertos interesados en tus retos. 
              Acepta para habilitar el chat y comenzar la colaboración.
            </p>
          </div>
          {pendingRequests.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tienes solicitudes pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((match) => {
                const expert = experts.find(e => e.userId === match.expertoId);
                const challenge = challenges.find(c => c.id === match.challengeId);
                const expertName = expertNames[match.expertoId] || 'Experto';
                return (
                  <Card key={match.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>⚙️</span>
                            {expertName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Para el reto: {challenge?.title || 'Cargando...'}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Pendiente</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {expert && (
                        <div className="space-y-4 mb-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Sobre el experto:</p>
                            <p className="text-sm text-muted-foreground">{expert.bio || 'Sin biografía'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Categorías:</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.categories.map(cat => (
                                <Badge key={cat} variant="secondary">{cat}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>💼 {expert.experience} años exp.</span>
                            <span>💰 {expert.hourlyRate}</span>
                            <span>⏰ {expert.availability}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={async () => {
                            await updateMatch(match.id, { status: 'rejected' });
                            await loadData();
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={async () => {
                            await updateMatch(match.id, { 
                              empresaInterested: true,
                              status: 'matched' 
                            });
                            await loadData();
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Aceptar y Habilitar Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chats" className="space-y-4">
          {confirmedMatches.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tienes chats activos</p>
                <p className="text-sm text-muted-foreground mt-2">Acepta solicitudes para iniciar conversaciones</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {confirmedMatches.map((match) => {
                const expertName = expertNames[match.expertoId] || 'Experto';
                return (
                  <Card key={match.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>⚙️</span>
                        {expertName}
                      </CardTitle>
                      <CardDescription>Chat activo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setSelectedChat({ matchId: match.id, userName: expertName })}
                        className="w-full"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Abrir Chat
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedChat && (
        <ChatDialog
          matchId={selectedChat.matchId}
          otherUserName={selectedChat.userName}
          open={!!selectedChat}
          onOpenChange={(open) => !open && setSelectedChat(null)}
        />
      )}
    </div>
  );
};

export default EmpresaDashboard;
