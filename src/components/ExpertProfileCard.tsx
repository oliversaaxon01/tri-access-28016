import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExpertProfile } from '@/lib/db';
import { User, DollarSign, Clock } from 'lucide-react';

interface ExpertProfileCardProps {
  profile: ExpertProfile;
  userName: string;
  onSendMatch: () => void;
  matchStatus?: 'none' | 'pending' | 'matched';
}

export const ExpertProfileCard = ({ profile, userName, onSendMatch, matchStatus = 'none' }: ExpertProfileCardProps) => {
  return (
    <Card className="shadow-elegant hover:shadow-glow transition-smooth">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{userName}</CardTitle>
              <CardDescription>{profile.experience} años de experiencia</CardDescription>
            </div>
          </div>
          {profile.validated && (
            <Badge variant="default">Validado</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{profile.bio}</p>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Categorías:</div>
          <div className="flex flex-wrap gap-2">
            {profile.categories?.map((cat) => (
              <Badge key={cat} variant="secondary">{cat}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Expertise:</div>
          <div className="flex flex-wrap gap-2">
            {profile.expertise?.map((exp) => (
              <Badge key={exp} variant="outline">{exp}</Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>{profile.hourlyRate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{profile.availability}</span>
          </div>
        </div>

        <Button 
          onClick={onSendMatch} 
          className="w-full"
          disabled={matchStatus !== 'none'}
        >
          {matchStatus === 'pending' && 'Solicitud Enviada'}
          {matchStatus === 'matched' && 'Ya Conectado'}
          {matchStatus === 'none' && 'Enviar Solicitud'}
        </Button>
      </CardContent>
    </Card>
  );
};
