if (parseInt(process.versions.node.split(".")[0], 10) > 20) {
  console.error("Testing allowed error on Node 22");
  process.exit(1);
}
