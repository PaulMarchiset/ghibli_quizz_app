<script setup lang="ts">
defineProps<{
  rank: number
  name: string
  score: number
}>()

function getRankColor(rank: number) {
  switch (rank) {
    case 1:
      return '#FFD700' // Gold
    case 2:
      return '#C0C0C0' // Silver
    case 3:
      return '#CD7F32' // Bronze
    default:
      return '#facc15' // Default yellow for other ranks
  }
}

</script>

<template>
  <div class="leaderboard-item">
    <div class="left-section">
      <!-- Rank circle -->
      <div class="rank-circle" :style="{ backgroundColor: getRankColor(rank) }">
        <span class="rank-number">{{ rank }}</span>
      </div>
      
      <!-- Name -->
      <span class="name">{{ name }}</span>
    </div>
    
    <!-- Score -->
    <span class="score">{{ score }} pts</span>
  </div>
</template>

<style scoped>
.leaderboard-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 100px;
  padding: 0.5rem 1.25rem 0.5rem 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-width: 0;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rank-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #facc15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #000;
}

.name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #000;
}

.score {
  font-size: 1.125rem;
  font-weight: 500;
  color: #6b7280;
}

@media (max-width: 640px) {
  .leaderboard-item {
    border-radius: 20px;
    padding: 0.5rem 1rem 0.5rem 0.5rem;
  }

  .rank-circle {
    width: 40px;
    height: 40px;
  }

  .rank-number {
    font-size: 1rem;
  }

  .name {
    font-size: 1rem;
  }

  .score {
    font-size: 0.95rem;
  }
}
</style>