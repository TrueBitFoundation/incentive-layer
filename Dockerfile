FROM ubuntu:17.04
MAINTAINER Harley Swick

ENV PATH="${PATH}:/node-v6.11.3-linux-x64/bin"

RUN apt-get update && \
  apt-get install -y curl && \
  curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
  apt-get install -y nodejs && \
  npm install -g ethereumjs-testrpc
  
RUN apt-get install -y git && \
	npm install truffle@v4.0.0-beta.0 -g && \
	git clone https://github.com/TrueBitFoundation/truebit-contracts && \
	cd truebit-contracts && \
	truffle test