// genuienly why does it not work on firebase, this better fix it
window.addEventListener("load", function () {
  const bgVideo = document.querySelector(".bg-video");
  if (bgVideo) {
    bgVideo.play().catch((err) => {
      console.warn("Autoplay prevented:", err);
    });
  }
});