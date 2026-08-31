FROM px4io/px4-dev-simulation-jammy:latest

# Clone PX4 Autopilot source code
# We use v1.14.0 for stability and fast cloning (depth 1)
RUN git clone --depth 1 --branch v1.14.0 https://github.com/PX4/PX4-Autopilot.git /src/PX4-Autopilot

WORKDIR /src/PX4-Autopilot

# Pre-build the SITL target so startup is fast
RUN make px4_sitl_default DONT_RUN=1

# Expose standard MAVLink UDP ports
EXPOSE 14550/udp
EXPOSE 14540/udp

# Run JMavSim headless so it doesn't crash trying to open an X11 display on Windows
ENV HEADLESS=1
CMD ["make", "px4_sitl", "jmavsim"]
