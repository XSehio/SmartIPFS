import Head from 'next/head'
import { useState } from 'react';
import { create } from 'ipfs-http-client'

//Se importa la librería web3
const Web3 = require('web3');

//Se define un compoennte. Un componente es un elemento de código que es reutilizable.
const MyComponent = () => {
  //Dentro del componente se define una variable de estado "file" y una función "setFile". 
  //La variable file contendrá el fichero que se suba y la función "setFile" será la 
  //encargada de actualizar su valor. La función setFile() actualizará el valor de file 
  //con cualquier cosa que pongamos dentro, en este caso, un archivo. useState(null) 
  //inicializa su valor a null.
  const [file, setFile] = useState(null);

  //abi contiene las definiciones de las funciones del smart contract a utilizar.
  const abi = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "fileHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "fileSize",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "fileType",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "fileName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address payable",
          "name": "uploader",
          "type": "address"
        }
      ],
      "name": "FileUploaded",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_fileHash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_fileSize",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_fileType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_fileName",
          "type": "string"
        }
      ],
      "name": "uploadFile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "checkFiles",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "fileHash",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "fileSize",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "fileType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "fileName",
              "type": "string"
            },
            {
              "internalType": "address payable",
              "name": "uploader",
              "type": "address"
            }
          ],
          "internalType": "struct SmartIPFS.File[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "hash",
          "type": "string"
        }
      ],
      "name": "downloadFile",
      "outputs": [
        {
          "internalType": "bool",
          "name": "_allowed",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "_fileName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_fileType",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
  ];

  //Conectamos al cliente de IPFS
  const ipfsClient = create( {
    host: 'localhost',
    port: 5001,
    protocol: 'http',
  } );

  //Se instancia un provider apuntando a la dirección donde está corriendo la blockhain
  const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

  //Se instancia la dirección del smart contract. Siempre que despleguemos un contrato 
  //nuevo en la blockchain debemos modificar su dirección.
  const contractAddress = '0x2B94700E6544d3144c659601Ee627eD97e3Dd56a';

  //Se instancia el smart contract
  const contract = new web3.eth.Contract(abi, contractAddress);

  //Se crea un handle que se ejecutará cada vez que se seleccione un archivo. Este handle 
  //guardará el contenido del archivo subido en un objeto "event", que podrá ser accedido 
  //cuando se pulse el botón para subir el archivo a IPFS
  const handleFileSelect = (event) => {
    setFile(event.target.files[0]); //Se actualiza la variable de estado "file".
  }

  //Se define una función que se ejecutará cuando se pulse el botón de "subir a ipfs".
  const uploadFileFcn = async () => {
    //Se lee el archivo usando un objeto "FileReader"
    if(!file) {
      alert("No se ha seleccionado ningún archivo. Por favor, selecciona uno.");
      return;
    };
    const address = document.getElementById("address").value;
    if (!address){
      alert("No se ha introducido ninguna cuenta")
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    console.log(file);

    reader.onload = async (event) => {
      // Se lee el contenido del fichero consultando el objeto "event"
      const fileBuff = event.target.result;

      //Se sube el fichero a IPFS
      const added = await ipfsClient.add(fileBuff);

      //Se llama a la función uploadFile para dejar constancia en la blockchain de que se ha
      //subido un archivo. Es necesario especificar los parámetros de entrada de la función 
      //así como el usuario que ha subido el archivo (from), el precio del gas (gasPrice) y 
      //el gas límite (gas)
      try{ 
        contract.methods.uploadFile(added.path, file.size, file.type, file.name)
          .send( {from: address, gasPrice: 1, gas: 6721975} )
          .on('receipt', (receipt) => { 
            console.log("receipt:",receipt ); 
            alert("Archivo subido correctamente. Hash del archivo: \n" + added.path);
          });
      }
      catch(error){
        alert("se ha producido un error. Por favor, comprueba que has introducido una "
        + "cuenta válida y que tienes suficientes fondos para realizar la operación. ");
        console.log(error);
      }
    }
  }

  const checkFilesFcn = async () => {
    const address = document.getElementById("address").value;

    contract.methods.checkFiles().call({from: address}).then( result => { 
      document.getElementById("list").innerHTML = ""; //Se limpia el contenido de la lista

      for (var i = 0; i < result.length; i++){
        const li = document.createElement("li");
        const fileSummary = "Nombre: " + result[i][3] + " Tamaño: " 
          + result[i][1] + " Hash: " + result[i][0];
        li.appendChild(document.createTextNode(fileSummary));
        document.getElementById("list").appendChild(li);
      }
    });
  }

  const downloadFileFcn = async () => {
    const address = document.getElementById("address").value;
    const fileToDownload = document.getElementById("fileToDownload").value;
    //Se comprueba que el usuario tiene permiso para descargar el archivo
    const result = await contract.methods.downloadFile(fileToDownload).call({from : address});

    if (result._allowed == false){
      alert("No se encuentra el archivo que quieres descargar.");
      return;
    }
    else {
      const resultFile = ipfsClient.cat(fileToDownload); //Se descarga el archivo (bytes)
      //Se convierten los bytes descargados a una array de bytes y posteriormente a un string
      let content = [];
      for await (const chunk of resultFile){
        content = [...content, ...chunk];
      }
      var fileContent;
      //Se comprueba el tipo de archivo, ya que dependiendo de esto la codificación de los bytes
      //se hará de una manera u otra.
      if(result._fileType == "text/plain" || result._fileType == "application/json"){
        //Archivo .txt y .json
        fileContent = Buffer.from(content).toString('utf8');
      }
      else if (result._fileType == "image/jpeg" || result._fileType == "application/pdf" 
        || result._fileType == "image/png"){
        //Archivo .jpeg, .png y .pdf
        fileContent = new Uint8Array(content);
        console.log("sabe");
      }

      console.log(result);

      const blob = new Blob([fileContent], { type: result._fileType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result._fileName;
      link.click();
      URL.revokeObjectURL(url);
    
    }
  }

  return (
    <>
      <Head>
        <title>SmartIPFS</title>
      </Head>
      <main>
        <div>
          <h3>Selecciona tu cuenta de ganache</h3>
          <form>
            <label for="name">Hash de la cuenta: </label>
            <input type="text" id="address" name="name"></input>
          </form>
        </div>
        <div>
          <h3>Sube tus archivos a IPFS</h3>
          <input type="file" onChange={handleFileSelect}/>
          <button onClick={uploadFileFcn}>Subir a IPFS</button>
        </div>
        <div>
          <h3>Descarga tus archivos</h3>
          <input type="text" id="fileToDownload"></input>
          <button onClick={downloadFileFcn}>Descargar archivo</button>
        </div>
        <div>
          <h3>Chequea tus archivos</h3>
          <button onClick={checkFilesFcn}>Ver archivos</button>
          <ul id="list"></ul>
        </div>
      </main>
    </>
    );
  }

export default MyComponent;