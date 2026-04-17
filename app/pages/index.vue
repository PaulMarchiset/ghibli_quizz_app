<template>
    <div class="mx-auto flex max-w-3xl flex-col gap-6">
        <div class="space-y-2">
            <h1 class="text-3xl font-bold text-gray-900">Studio Ghibli Quiz</h1>
            <p class="text-gray-700">
                Configure ta partie, créé la ou rejoins-en une avec tes amis !
            </p>
        </div>

        <GameRoomLobby />

        <div class="flex flex-wrap gap-3">
            <NuxtLink
                to="/history"
                class="inline-flex w-fit px-6 py-3 rounded-full btn-primary font-semibold"
            >
                Historique des scores
            </NuxtLink>
        </div>
    </div>
</template>