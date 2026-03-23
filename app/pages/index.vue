<template>
    <div class="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div class="max-w-xl mx-auto pt-8 flex flex-col gap-6">
            <div class="space-y-2">
                <h1 class="text-3xl font-bold text-gray-900">Studio Ghibli Quiz</h1>
                <p class="text-gray-700">
                    Configure ta partie, créé la ou rejoins-en une avec tes amis !
                </p>
            </div>

            <GameRoomLobby />

            <NuxtLink to="/history"
                class="inline-flex w-fit px-6 py-3 rounded-full bg-white text-gray-900 shadow-sm font-semibold">
                Historique des scores
            </NuxtLink>

        </div>
    </div>
</template>