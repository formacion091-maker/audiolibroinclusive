CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    correo VARCHAR(100),
    password VARCHAR(255)
);

CREATE TABLE libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200),
    autor VARCHAR(100),
    idioma VARCHAR(50),
    categoria VARCHAR(100),
    audio VARCHAR(255),
    imagen VARCHAR(255),
    descripcion TEXT
);