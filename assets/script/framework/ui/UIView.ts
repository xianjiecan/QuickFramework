import EventComponent from "../base/EventComponent";
import AudioComponent from "../base/AudioComponent";
import { uiManager } from "../base/UIManager";
import { LANG } from "../../common/manager/LanguageManager";
import { BUNDLE_RESOURCES } from "../base/Defines";

/**
 * @description 视图基类
 */
const { ccclass, property } = cc._decorator;

export interface UIClass<T extends UIView> {
    new(): T;
    /**
     *@description 视图prefab 地址 resources目录下如z_panels/WeiZoneLayer 
     */
    getPrefabUrl(): string;
}

@ccclass
export default abstract class UIView extends EventComponent {

    /**@description 是否允许接受键盘事件 */
    private _isEnableKey = false;

    public static getPrefabUrl(): string {
        if (CC_DEBUG) {
            cc.error(`请求实现public static getPrefabUrl`);
        }
        return "unknown";
    }

    /**@description init代码参数 */
    private _args: any[] = null;
    /**@description 当前传入参数，即通过UI管理器打开时的传入参数 */
    public get args() {
        return this._args;
    }

    /**
     * @description 查找子节点
     * @param path 子节点路径
     * @param referenceNode 从哪一个节点开始查找，
     * referenceNode如果有值，从传入节点中查找，
     * referenceNode如果没有值，this.content有值，默认从this.content进行查找
     * referenceNode如不传入，且this.content没有值，相当于使用了cc.find
     */
    protected find(path: string, referenceNode?: cc.Node) {
        if (referenceNode) {
            return cc.find(path, referenceNode);
        } else {
            if (this.content) {
                return cc.find(path, this.content);
            } else {
                return cc.find(path, referenceNode);
            }
        }
    }

    /**
     * @description 当前界面的节点，如果界面需要使用动画打开或关闭，
     * 可直接对content进行赋值，
     * 使用showWithAction 有动画显示
     * 使用hideWithAction 有动画隐藏
     * 使用closeWithAction 有动画关闭
     * */
    private _content: cc.Node = null;
    protected set content(value: cc.Node) {
        this._content = value;
    }
    protected get content() {
        return this._content;
    }

    /**本组件的类名 */
    private _className: string = "unknow";
    public set className(value: string) {
        this._className = value;
    }
    public get className(): string {
        return this._className;
    }

    private _bundle: BUNDLE_TYPE = null;
    /**指向当前View打开时的bundle */
    public set bundle( value ){
        this._bundle = value;
    }
    public get bundle(){
        return this._bundle;
    }

    public init(args: any[]) {
        this._args = args;
    }

    public close() {
        uiManager().close(this.className);
    }

    /**@description args为open代入的参数 */
    public show(args: any[]) {
        //再如果界面已经存在于界面管理器中，不会再进入init函数，此时传入新的参数，只从show里面过来,这里重新对_args重新赋值
        this._args = args;
        if (this.node) this.node.active = true;
    }

    public hide() {
        if (this.node) this.node.removeFromParent(false);
    }

    /**@description 动画显示界面 
     *@param isOverrideShow 是否是重写show调用的,如果是重写show调用了,必将此参数设置为true,否则会产生死循环递归调用 
     *@param completeCallback 完成回调
     *@example 
     *  示例： 通常在init/onLoad函数中调用 showWithAction,
     *  但如果需要界面通过hide隐藏，而不是关闭界面时，下一次显示时
     *  管理器直接调用了show,没有执行界面的打开动画，如果还需要界面打开动画
     *  需要按如下方式重写show方法
     *  show( args : any[] ){
     *      super.show(args);
     *      this.showWithAction(true);
     *      //to do => 
     *  }
     */
    public showWithAction(isOverrideShow = false, completeCallback?: () => void) {
        if (this.content) {
            if (!isOverrideShow) this.show(this.args);
            this.content.stopAllActions();
            cc.tween(this.content)
                .set({ scale: 0.2 })
                .to(0.2, { scale: 1.15 })
                .delay(0.05)
                .to(0.1, { scale: 1.0 })
                .call(() => {
                    if (completeCallback) completeCallback();
                })
                .start();
        }
    }

    /**@description 动画隐藏界面 
     *@param isOverrideHide 是否是重写hide调用的,如果是重写hide调用了,必将此参数设置为true,否则会产生死循环递归调用 
     *@param completeCallback 完成回调
     */
    public hideWithAction(completeCallback?: () => void) {
        if (this.content) {
            this.content.stopAllActions();
            cc.tween(this.content)
                .to(0.2, { scale: 1.15 })
                .to(0.1, { scale: 0.3 })
                .call(() => {
                    this.hide();
                    this.content.scale = 1.0;
                    if (completeCallback) completeCallback();
                })
                .start();
        }
    }

    /**@description 动画关闭界面 
     *@param completeCallback 完成回调
     */
    public closeWithAction(completeCallback?: () => void) {
        if (this.content) {
            this.content.stopAllActions();
            cc.tween(this.content)
                .to(0.2, { scale: 1.15 })
                .to(0.1, { scale: 0.3 })
                .call(() => {
                    if (completeCallback) completeCallback();
                    this.close();
                })
                .start();
        }
    }


    /**
     * @description 启用物理返回键按钮
     * @param isEnabled true 启用，
     * @example 重写onKeyBack方法
     */
    protected setEnabledKeyBack(isEnabled: boolean) {
        if (isEnabled) {
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP);
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        } else {
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP);
        }

        this._isEnableKey = isEnabled;
    }

    protected isEnabledKeyBack() {
        return this._isEnableKey;
    }

    protected onKeyUp(ev: cc.Event.EventKeyboard) {
        if (CC_DEBUG) {
            cc.log(`[${cc.js.getClassName(this)}] onKeyUp keyCode : ${ev.keyCode}`);
        }
        if (ev.keyCode == cc.macro.KEY.escape) {
            this.onKeyBack(ev);
        }
    }

    protected onKeyBack(ev: cc.Event.EventKeyboard) {
        //只有一个接受，不再向上传播
        ev.stopPropagation();
    }

    protected audioHelper: AudioComponent = null;

    onLoad() {
        this.audioHelper = this.addComponent(AudioComponent);
        this.audioHelper.owner = this;
        super.onLoad();
    }

    private _enterBackgroundTime = 0;
    private _enableFrontAndBackgroundSwitch = false;
    public set enableFrontAndBackgroundSwitch(value) {
        this._enableFrontAndBackgroundSwitch = value;
        if (value) {
            cc.game.on(cc.game.EVENT_SHOW, this._onEnterForgeGround, this);
            cc.game.on(cc.game.EVENT_HIDE, this._onEnterBackground, this);
        } else {
            cc.game.off(cc.game.EVENT_SHOW, this._onEnterForgeGround, this);
            cc.game.off(cc.game.EVENT_HIDE, this._onEnterBackground, this);
        }
    }
    public get enableFrontAndBackgroundSwitch() {
        return this._enableFrontAndBackgroundSwitch;
    }

    protected _onEnterBackground() {
        this._enterBackgroundTime = Date.timeNow();
        this.onEnterBackground();
    }

    private _onEnterForgeGround() {
        let now = Date.timeNow();
        let inBackgroundTime = now - this._enterBackgroundTime;
        this.onEnterForgeground(inBackgroundTime);
    }

    protected onEnterForgeground(inBackgroundTime: number) {

    }
    protected onEnterBackground() {

    }

    /**
     * @description 自动语言动态适配
     * 需在creator编辑器中将带label组件的节点命名为'label'，让后将语言包中的key填入string，在界面初始化时调用adaptLanguage()即可。
     */
    private arrLabel: Array<cc.Label> = new Array<cc.Label>();
    private arrLabelKey: Array<string> = new Array<string>();
    
    //自动适配语言刷新界面
    protected adaptLanguage(){
        if (this.arrLabelKey.length <= 0) {
            this.checkLabal(this.node, 'label');
            if (this.arrLabel && this.arrLabel.length > 0) {
                for (let i = 0; i < this.arrLabel.length; i++) {
                    const element = this.arrLabel[i];
                    let key = element.string;
                    this.arrLabelKey.push(key);
                }
            }
        }

        for (let i = 0; i < this.arrLabelKey.length; i++) {
            const element = this.arrLabel[i];
            let key = this.arrLabelKey[i];
            let arrKey = key.split('.');
            let strText = undefined;
            if (arrKey.length === 1) {
                strText = LANG[arrKey[0]];
            } else if (arrKey.length === 2 && LANG[arrKey[0]]) {
                strText = LANG[arrKey[0]][arrKey[1]];
            } else if (arrKey.length === 3 && LANG[arrKey[0]] && LANG[arrKey[0]][arrKey[1]]) {
                strText = LANG[arrKey[0]][arrKey[1]][arrKey[2]];
            } else {
                strText = undefined;
            }
            if (strText) {
                element.string = strText;
            } else {
                element.string = '';
                cc.error('err: ' + key + ' 未找到语言包');
            }
        }
    }

    //递归遍历节点label
    private checkLabal(node: cc.Node, name: string){
        if (node && node.childrenCount > 0) {
            node.children.forEach(element => {
                if (element.name === name) {
                    let label = element.getComponent(cc.Label);
                    if (label) {
                        this.arrLabel.push(label);
                    }
                }
                this.checkLabal(element, name);
            });
        }
    }
}
