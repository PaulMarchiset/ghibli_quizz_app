<template>
    <div class="flex min-h-screen flex-col bg-gray-100 text-gray-900">
        <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
            <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <NuxtLink to="/" class="text-lg font-semibold tracking-tight">
                    Studio Ghibli Quiz
                </NuxtLink>
                <nav class="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <NuxtLink to="/game" class="nav-link rounded-full px-3 py-2" active-class="nav-link--active">
                        Jouer
                    </NuxtLink>
                    <NuxtLink to="/history" class="nav-link rounded-full px-3 py-2" active-class="nav-link--active">
                        Historique
                    </NuxtLink>
                </nav>
            </div>
        </header>

        <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            <slot />
        </main>

        <footer class="border-t border-gray-200 bg-white">
            <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-gray-600 sm:px-6">
                <p class="font-semibold text-gray-900">Studio Ghibli Quiz</p>
                <p>Quiz multijoueur sur l'univers de Studio Ghibli. Les données viennent des APIs Ghibli et Jikan</p>
            </div>
        </footer>
    </div>
</template>
