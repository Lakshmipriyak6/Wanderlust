module.exports = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch((err) => {
                console.error("WRAPASYNC ERROR:");
                console.error(err);
                next(err);
            });
    };
};
