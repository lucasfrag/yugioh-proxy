const app = require('./app');
const { PORT, IMAGES_BASE_DIR } = require('./config');

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Servidor Yu-Gi-Oh! API iniciado com sucesso!`);
  console.log(`🖥️  Local: http://localhost:${PORT}`);
  console.log(`📁 Servindo imagens de: ${IMAGES_BASE_DIR}`);
  console.log(`==================================================\n`);
});
