import {useLayoutEffect} from "react";
import {useLocation} from "react-router-dom";

/** React Router keeps the old scroll position unless we reset it on navigation. */
function ScrollToTop() {
    const {pathname} = useLocation();

    useLayoutEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: "instant"});
    }, [pathname]);

    return null;
}

export default ScrollToTop;
