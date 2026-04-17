module.exports = function (str) {
  return (str || "")
    .replace(/-\*/g, "")
    .replace(/[']/g, "")
    .replace(/[.]/g, "")
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
};