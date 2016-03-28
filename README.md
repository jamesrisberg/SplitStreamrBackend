# SplitStreamr

This is the server side of [SplitStreamr](https://github.com/jamesrisberg/SplitStreamrIOS). 

## How it works

All devices on the mesh network, both the Player and however many Nodes are present, are connected to the server through a shared web socket. This allows the server to have knowledge of how many devices are on the network at any given point and to send data to each of them in turn.

When a song is requested by the Player, the server retrieves the music file and chunks the data into uniform chunks. It packages each chunk along with an ID number and sends the data to the next device that requests a chunk. 
