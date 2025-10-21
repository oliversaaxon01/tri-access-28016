// Matching algorithm based on categories and other criteria
import { Challenge, ExpertProfile, Match } from './db';

export interface MatchScore {
  challengeId: string;
  expertId: string;
  score: number;
  matchedCategories: string[];
}

export const calculateMatchScore = (
  challenge: Challenge,
  expert: ExpertProfile,
  weights: { expertise: number; budget: number; deadline: number; availability: number }
): number => {
  let score = 0;

  console.log('=== Calculating match score ===');
  console.log('Challenge:', challenge.title, 'Categories:', challenge.categories);
  console.log('Expert:', expert.userId, 'Categories:', expert.categories);

  // Category match (most important)
  const categoryMatch = challenge.categories?.some(cat => 
    expert.categories?.includes(cat)
  ) ?? false;
  
  console.log('Category match found:', categoryMatch);
  
  if (!categoryMatch) return 0; // No match if no common categories

  // Count matching categories
  const matchingCategoriesCount = challenge.categories?.filter(cat => 
    expert.categories?.includes(cat)
  ).length ?? 0;
  
  console.log('Matching categories count:', matchingCategoriesCount);
  
  score += (matchingCategoriesCount / (challenge.categories?.length ?? 1)) * weights.expertise * 100;

  // Expertise match
  const expertiseMatch = challenge.categories?.some(cat => 
    expert.expertise?.some(exp => exp.toLowerCase().includes(cat.toLowerCase()))
  ) ?? false;
  
  if (expertiseMatch) {
    score += weights.expertise * 20;
  }

  // Availability bonus
  if (expert.availability === 'Disponible') {
    score += weights.availability * 20;
  }

  console.log('Final score:', score);
  
  return score;
};

export const findBestMatches = (
  challenges: Challenge[],
  experts: ExpertProfile[],
  weights: { expertise: number; budget: number; deadline: number; availability: number },
  threshold: number = 50
): MatchScore[] => {
  const matches: MatchScore[] = [];

  for (const challenge of challenges) {
    if (challenge.status !== 'active') continue;

    for (const expert of experts) {
      const score = calculateMatchScore(challenge, expert, weights);
      
      if (score >= threshold) {
        const matchedCategories = challenge.categories?.filter(cat =>
          expert.categories?.includes(cat)
        ) ?? [];

        matches.push({
          challengeId: challenge.id,
          expertId: expert.userId,
          score,
          matchedCategories
        });
      }
    }
  }

  // Sort by score (highest first)
  return matches.sort((a, b) => b.score - a.score);
};
