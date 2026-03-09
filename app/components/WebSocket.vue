    <script setup lang="js">
    import { onMounted, onBeforeUnmount } from "vue";
    import { useNuxtApp } from "#app";

    const { $socket } = useNuxtApp();
    let messages = "No messages yet.";

    onMounted(() => {
        // Check if socket is available
        if ($socket) {
            console.log("Socket connected:", $socket);

            // Listen for events from the backend
            $socket.on("message", (channel, data) => {
                console.log("Received message:", data);
                messages = data;
            });

            // Emit an event to the backend
            $socket.emit("joinRoom", { room: "general" });
        } else {
            console.error("Socket is not available.");
            messages = "Socket is not available.";
        }
    });

    onBeforeUnmount(() => {
        // Clean up the socket listener on component unmount
        if ($socket) {
            $socket.off("message");
            $socket.off("disconnect");
            $socket.off("error");
            $socket.io.off("connect");
        }
    });
</script>


<template>
    <div>
        <p>WEB SOCKET COMPONENT</p>
        <p>{{ messages }}</p>
    </div>
</template>
