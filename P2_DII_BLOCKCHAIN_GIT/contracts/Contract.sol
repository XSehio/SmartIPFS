// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract SmartIPFS {
    string public name = "SmartIPFS";

    mapping(address => mapping(uint256 => File)) fileProperty; //Esta variable asocia una 
    //lista de hashes a cada usuario
    mapping(address => uint256) fileCountProperty; //Esta variable guarda cuántos archivos 
    //ha subido cada usuario

    struct File {
        string fileHash;
        uint256 fileSize;
        string fileType;
        string fileName;
        address payable uploader;
    }

    event FileUploaded(
        string fileHash,
        uint256 fileSize,
        string fileType,
        string fileName,
        address payable uploader
    );

    //Se define una función para subir un archivo a IPFS
    function uploadFile(
        string memory _fileHash,
        uint256 _fileSize,
        string memory _fileType,
        string memory _fileName
    ) public {
        require(bytes(_fileHash).length > 0);
        require(bytes(_fileType).length > 0);
        require(bytes(_fileName).length > 0);
        require(msg.sender != address(0));
        require(_fileSize > 0);

        File memory file_a_guardar = File(
            _fileHash,
            _fileSize,
            _fileType,
            _fileName,
            payable(msg.sender)
        );
        
        //Se añade el nuevo archivo a la lista de archivos del usuario
        fileProperty[msg.sender][fileCountProperty[msg.sender]] = file_a_guardar;

        fileCountProperty[msg.sender]++;

        // From the frontend application
        // we can listen the events emitted from
        // the smart contract in order to update the UI.
        emit FileUploaded(
            _fileHash,
            _fileSize,
            _fileType,
            _fileName,
            payable(msg.sender)
        );
    }

    //Esta función permite ver los archivos que tiene un usuario
    function checkFiles () public view returns (File[] memory){
        File[] memory _files = new File[](fileCountProperty[msg.sender]);

        for (uint256 i = 0; i < fileCountProperty[msg.sender]; i++){
            _files[i] = fileProperty[msg.sender][i];
        }

        return _files;
    }

    //Esta función permite comprobar si el usuario tiene permiso para descargar un archivo. 
    //Si el archivo es de su propiedad lo podrá descargar, si no, no.
    function downloadFile(string memory hash) public view returns (
        bool _allowed, 
        string memory _fileName, 
        string memory _fileType)
        {
        //Si el archivo pertenece al usuario que ejecuta la función, devuelve allowed = true.
        //También se devuelven el nombre del archivo y el tipo ya que serán necesarios para 
        //reconstruir el archivo.
        for (uint256 i = 0; i < fileCountProperty[msg.sender]; i++){
            //Si dentro del "if" se comparan directamente "fileHash" y "hash" se están 
            //comparando realmente las direcciones de memoria de ambas variables, por lo que
            //es necesario extraer su contenido utilizando keccak256(abi.encodePacked)
            string memory fileHash = fileProperty[msg.sender][i].fileHash;
            if( keccak256(abi.encodePacked(fileHash)) == keccak256(abi.encodePacked(hash))){
                _allowed = true;
                _fileName = fileProperty[msg.sender][i].fileName;
                _fileType = fileProperty[msg.sender][i].fileType;
                return (_allowed, _fileName, _fileType);
            }
        }
        _allowed = false;
        return (_allowed, _fileName, _fileType);
    }
}