import java.io.IOException;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import javax.imageio.ImageIO;
import java.applet.Applet;
/**
 * Write a description of class ImageToArray here.
 * 
 * @author (your name) 
 * @version (a version number or a date)
 */
public class ImageToArray
{
    public static void main (String[] args) {
        BufferedImage img = null;
        try {
            img = ImageIO.read(new File("../collision_map.png"));
            int height = img.getHeight();
            int width = img.getWidth();
            int stringIndex = 0;
            StringBuilder strB = new StringBuilder();
            String pixels = "";
            Color pixColor;
            int color;
            final int BLACK = -16777216;
            final int GREY = -5395027;
            final int WHITE = -1;
            final int BLUE = -16772225;
            for(int i = 0; i < height; i++){
                stringIndex = width * i;
                for(int j = 0; j < width; j++){
                    pixColor = new Color(img.getRGB(j,i));
                    color = pixColor.getRGB();
                    if(color == BLACK){
                        //sets black areas to uncollidable
                        strB.append(1);
                        img.setRGB(j, i, BLACK);
                    }else if(color == GREY){
                        //sets grey areas to special overlapping
                        strB.append(2);
                        img.setRGB(j, i,GREY);
                    }else if(color == WHITE){
                        //sets white areas to nothing
                        strB.append(0);
                        img.setRGB(j, i, WHITE);
                    }else if(color == BLUE){
                        //sets blue areas to water
                        strB.append(3);
                        img.setRGB(j, i, BLUE);
                    }else{
                        System.out.println(color);
                        strB.append(0);
                        img.setRGB(j, i, WHITE);
                    }
                }
            }
            try (PrintStream out = new PrintStream(new FileOutputStream("../collisionMap.txt"))){
                out.print(strB.toString());
                out.flush();
                out.close();
            } catch (IOException e) {
                System.out.println("Write failed");
            }
        } catch (IOException e) {
        }
    }
    
    /*public void paint(Graphics g) {
        g.drawImage(read(),0,0,null);
    }*/
}