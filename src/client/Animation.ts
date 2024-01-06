import Cell from './Cell'
import Rect from './Rect'
import Render from './Render'

class Animation
{
    private cell: Cell
    private canvas: HTMLCanvasElement
    private alpha: number = 1
    private gradientDecrease: boolean = true

    private static readonly DURATION: number = 600
    private static readonly APLHA_GRADIENT: number = 0.2
    private static readonly ANIMATION_TIMEOUT: number = 50

    constructor(cell: Cell, canvas: HTMLCanvasElement) {
        this.cell = cell
        this.canvas = canvas
        this.startAnimation()
    }

    public startAnimation() {
        this.animate(Date.now())
    }

    private animate(started: number) {
        const context = this.canvas.getContext("2d")
        if (!context) {
            throw Error("Can't get context")
        }

        if (this.gradientDecrease) {
            this.alpha = Math.round(Math.max(0, this.alpha - Animation.APLHA_GRADIENT) * 100) / 100
        } else {
            this.alpha = Math.round(Math.min(this.alpha + Animation.APLHA_GRADIENT, 1) * 100) / 100
        }
        if (this.alpha === 0 || this.alpha === 1) {
            this.gradientDecrease = !this.gradientDecrease
        }

        const rect: Rect = this.cell.rect
        context.beginPath()
        context.clearRect(rect.ltPoint.x, rect.ltPoint.y, rect.getWidth(), rect.getHeight())
        context.rect(rect.ltPoint.x, rect.ltPoint.y, rect.getWidth(), rect.getHeight())
        context.globalAlpha = Math.random()
        context.fillStyle = 'red'
        context.fill()
        context.closePath()

        const duration: number = Date.now() - started
        if (duration < Animation.DURATION) {
            setTimeout(() => {
                    this.animate(started)
                }, Animation.ANIMATION_TIMEOUT)
        } else {
            this.cell.setChanged()
            window.render.refreshGrid(this.canvas, window.shipsBoard)
        }
    }
}

export default Animation