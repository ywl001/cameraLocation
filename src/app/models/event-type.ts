export class EventType {

    //十字光标
    public static CURSOR_CROSSHAIR = "crosshair";

    //链接光标
    public static CURSOR_POINTER = "pointer";

    //箭头光标
    public static CURSOR_DEFAULT = "default";

    //默认光标
    public static CURSOR_AUTO="auto";

    /**
     * 标注图片加载完毕
     */
    public static MARKER_IMAGE_LOADED: string = "markerImageLoaded";

    /**
     * 移动标注
     */
    public static MOVE_MARKER: string = "moveMarker"

    /**
     * 隐藏infowindow
     */
    public static HIDE_INFO_WINDOW: string = "hideInfoWindows";


    /**
     * 设置鼠标光标
     */
    public static SET_CURSOR:string="setCursor";

    /**
     * 登录成功
     */
    public static LOGIN_SUCCESS:string = "loginSuccess";


    public static MAP_LAYER_CHANGE:string = 'mapLayerChange';

    public static SHOW_SEARCH_MARK:string = 'showSearchMark'

    public static REFRESH_MARK:string = 'refreshMark'
    
    public static CLOSE_DRAWER: string = 'closeDrawer';
    public static SHOW_IMAGE: string = 'showImage'

}
