# ABEBox
[**ABEBox**][ABEBox] provides ***end-to-end encryption*** on top of your file sharing service (e.g., Dropbox, Google Drive, Owncloud,...) using *Attribute-Based Encryption*. It allows you to share files within your favourite service in a secure way by also defining a fine-grained access policy to manage the access to your files without any third party.

ABEBox is an [ElectronJS][ElectronJS] application based on [VueJS][VueJS] and [NodeJS][NodeJS], that makes use of the Rust ABE library [Rabe][Rabe]. 

You can download the application [here][ABEBox]. It is available for Windows, MacOS and Linux.

# Installation Requirements
Here is the list of libraries required to install ABEBox on Linux:
- ***git***,
- ***node*** (version >= 16),
- ***cargo***,
- ***yarn*** (npm install yarn).

# Install
Download the git repository, open a shell, place inside the folder and run the following commands 
> git submodule update --init --recursive
> 
> yarn

# Build / Run
To build ABEBox, run the following command
> yarn electron:build

To start ABEBox directly, run the following command 
> yarn electron:serve 



[ElectronJS]: (https://www.electronjs.org/)
[VueJS]: (https://vuejs.org/)
[NodeJS]: (https://nodejs.org/)
[Rabe]: (https://github.com/Fraunhofer-AISEC/rabe.git)
[ABEBox]: (http://abebox.netgroup.uniroma2.it/)