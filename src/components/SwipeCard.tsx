import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, Calendar, DollarSign } from 'lucide-react';
import { Challenge } from '@/lib/db';

interface SwipeCardProps {
  challenge: Challenge;
  onSwipe: (interested: boolean) => void;
}

export const SwipeCard = ({ challenge, onSwipe }: SwipeCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSwipe = (interested: boolean) => {
    setIsAnimating(true);
    setTimeout(() => {
      onSwipe(interested);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <Card className={`shadow-elegant hover:shadow-glow transition-all ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{challenge.title}</CardTitle>
            <Badge variant="secondary" className="mb-2">
              {challenge.category}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-base leading-relaxed mt-2">
          {challenge.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>{challenge.budget}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(challenge.deadline).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleSwipe(false)}
          >
            <X className="mr-2 h-5 w-5" />
            No Interesado
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => handleSwipe(true)}
          >
            <Check className="mr-2 h-5 w-5" />
            Me Interesa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
