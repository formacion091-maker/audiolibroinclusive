# Audiolibro Inclusivo

Una plataforma web para audiolibros inclusivos que permite a los usuarios acceder a libros de audio de manera fácil y accesible.

## Características

### 🎵 Biblioteca de Audiolibros
- **Lectura automática de carpeta**: La página lee automáticamente todos los archivos de audio (.wav, .mp3, .ogg, .m4a) de la carpeta `audios/` y los muestra como libros disponibles.
- **Base de datos**: Los libros también se pueden gestionar a través de una base de datos MySQL.
- **Búsqueda local**: Funcionalidad de búsqueda que filtra libros por título, autor o descripción sin depender de APIs externas.

### 🎤 Reconocimiento de Voz
- **Búsqueda por voz**: Los usuarios pueden buscar libros usando comandos de voz.
- **Activación por botón**: Botón dedicado para activar el reconocimiento de voz.

### 📚 Gestión de Libros
- **Subida de libros**: Formulario para subir nuevos audiolibros con validación de formatos.
- **Formatos soportados**: Audio (.wav, .mp3, .ogg, .m4a) e imágenes (.jpg, .jpeg, .png, .gif).
- **Metadatos**: Título, autor, idioma, categoría y descripción.

### 🔐 Sistema de Usuarios
- **Registro y login**: Sistema básico de autenticación de usuarios.
- **Biblioteca privada**: Página dedicada para usuarios registrados.

### 📱 Diseño Responsivo
- **Interfaz moderna**: Diseño CSS responsivo que funciona en dispositivos móviles y de escritorio.
- **Accesibilidad**: Enfocado en la inclusión y facilidad de uso.

## Estructura del Proyecto

```
audiolibroinclusive/
├── index.php          # Página principal pública
├── biblioteca.php     # Página privada para usuarios logueados
├── login.php          # Página de inicio de sesión
├── registro.php       # Página de registro
├── subir_libros.php   # Formulario para subir libros
├── conexion.php       # Conexión a la base de datos
├── database.sql       # Estructura de la base de datos
├── estilos.css        # Estilos CSS responsivos
├── script.js          # Funcionalidades JavaScript (voz, búsqueda)
├── audios/            # Carpeta para archivos de audio
├── imagenes/          # Carpeta para imágenes de portada
└── test_libros.php    # Script de prueba para verificar funcionalidad
```

## Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd audiolibroinclusive
   ```

2. **Configura la base de datos**:
   - Importa `database.sql` en tu servidor MySQL
   - Actualiza las credenciales en `conexion.php`

3. **Configura las carpetas**:
   - Asegúrate de que las carpetas `audios/` e `imagenes/` existan y tengan permisos de escritura
   - Coloca archivos de audio en `audios/` para que aparezcan automáticamente en la biblioteca

4. **Configura OpenAI**:
   - Copia `.env.example` a `.env`
   - Reemplaza `OPENAI_API_KEY=pon_aqui_tu_clave_openai` con tu clave real de OpenAI
   - Si deseas cambiar el tiempo de espera, ajusta `OPENAI_TIMEOUT`

5. **Servidor web**:

### Para Usuarios
1. **Accede a la página principal**: `index.php`
2. **Regístrate**: Crea una cuenta en `registro.php`
3. **Inicia sesión**: Accede a tu biblioteca privada en `biblioteca.php`
4. **Busca libros**: Usa la barra de búsqueda o el botón de voz
5. **Escucha libros**: Haz clic en los controles de audio para reproducir

### Para Administradores
1. **Sube libros**: Usa `subir_libros.php` para agregar nuevos audiolibros
2. **Gestiona archivos**: Coloca archivos de audio directamente en la carpeta `audios/` para que aparezcan automáticamente

## Funcionalidades Técnicas

### Lectura Automática de Carpeta
La función `obtenerLibrosCarpeta()` en `index.php` y `biblioteca.php`:
- Escanea la carpeta `audios/`
- Detecta archivos con extensiones .wav, .mp3, .ogg, .m4a
- Convierte nombres de archivo en títulos legibles
- Asigna tipos MIME correctos para reproducción HTML5

### Búsqueda Local
- Implementada en JavaScript (`script.js`)
- Filtra libros por data attributes (título, autor, descripción)
- Funciona tanto para libros de BD como de carpeta

### Reconocimiento de Voz
- Usa Web Speech API cuando está disponible en el navegador
- Si el navegador no soporta reconocimiento nativo, graba audio y lo envía al servicio de OpenAI Whisper para transcribirlo
- Activable mediante botón
- Convierte voz a texto para búsqueda y chat

### Chat con IA y lectura de libros
- Usa OpenAI para resumir y leer libros en voz alta
- Implementa streaming en vivo de respuestas para mostrar texto mientras se genera
- Requiere configurar la clave de OpenAI en `.env`

## Tecnologías Utilizadas

- **Backend**: PHP 7+
- **Base de datos**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript
- **Audio**: HTML5 Audio API
- **Voz**: Web Speech API

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico o preguntas, por favor abre un issue en el repositorio.